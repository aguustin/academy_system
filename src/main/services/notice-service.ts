import type {
  CreateNoticeResult,
  Notice,
  NoticeInput,
  NoticeMode,
  NoticeRecipient,
  NoticeRecipientDetail,
  PickedNoticeImage
} from '../../shared/notices'
import { pickAndStoreFile, readStoredFileAsDataUrl, removeStoredFile } from './file-storage'
import {
  createNotice as createNoticeInDb,
  createNoticeRecipients,
  listNotices as listNoticesInDb,
  listNoticeRecipients as listNoticeRecipientsInDb
} from '../db/notice'
import { listAllEnrollments, listEnrollmentsByCourseEdition } from '../db/enrollment'
import { listClassSessionsByDate } from '../db/class-session'
import { mongoStudentProvider } from '../providers/mongo-student-provider'
import type { Student } from '../../shared/students'

const NOTICE_IMAGE_FOLDER = 'notices'
const NOTICE_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp']

// Los teléfonos se cargan hoy como "261XXXXXXX" (código de área + número, sin el 0/15 ni el
// país). WhatsApp necesita el formato completo: 549 + esos 10 dígitos.
function normalizeWhatsAppPhone(phone: number): string | null {
  const digits = String(phone).trim()
  return /^\d{10}$/.test(digits) ? `549${digits}` : null
}

// "Por fecha" busca clases ya generadas ese día: si una clase se cancela antes de crear el
// aviso, deja de existir y el aviso simplemente no la tiene en cuenta (comportamiento esperado,
// no hace falta ningún manejo especial para clases canceladas).
async function resolveRecipientStudentIds(mode: NoticeMode, date: Date): Promise<string[]> {
  if (mode === 'all') {
    const enrollments = await listAllEnrollments()
    return [...new Set(enrollments.map((enrollment) => enrollment.studentId))]
  }

  const classSessions = await listClassSessionsByDate(date)
  const courseEditionIds = [...new Set(classSessions.map((session) => session.courseEditionId))]
  const enrollmentLists = await Promise.all(
    courseEditionIds.map((courseEditionId) => listEnrollmentsByCourseEdition(courseEditionId))
  )
  return [...new Set(enrollmentLists.flat().map((enrollment) => enrollment.studentId))]
}

function toRecipientDetail(studentId: string, student: Student | null): NoticeRecipientDetail {
  const phone = student ? normalizeWhatsAppPhone(student.phone) : null
  return {
    id: studentId,
    studentId,
    studentName: student ? `${student.lastName} ${student.firstName}` : studentId,
    dni: student?.dni ?? '—',
    phone,
    status: phone ? 'pending' : 'invalid-phone'
  }
}

// Núcleo reutilizable: lo usan tanto la vista previa (antes de confirmar, sin persistir nada)
// como la creación real del aviso, para no resolver destinatarios con dos lógicas distintas.
async function resolveRecipients(mode: NoticeMode, date: Date): Promise<NoticeRecipientDetail[]> {
  const studentIds = await resolveRecipientStudentIds(mode, date)
  const students = await Promise.all(
    studentIds.map((studentId) => mongoStudentProvider.findById(studentId))
  )
  return studentIds.map((studentId, index) => toRecipientDetail(studentId, students[index]))
}

async function enrichRecipients(recipients: NoticeRecipient[]): Promise<NoticeRecipientDetail[]> {
  return Promise.all(
    recipients.map(async (recipient) => {
      const student = await mongoStudentProvider.findById(recipient.studentId)
      return {
        id: recipient.id,
        studentId: recipient.studentId,
        studentName: student ? `${student.lastName} ${student.firstName}` : recipient.studentId,
        dni: student?.dni ?? '—',
        phone: recipient.phone,
        status: recipient.status
      }
    })
  )
}

// Paso separado de la creación: abre el selector, copia la imagen a almacenamiento local y
// devuelve también una vista previa (el renderer no tiene acceso al sistema de archivos). Null
// si el usuario cancela el selector; la imagen es opcional, así que cancelar no es un error.
export async function pickNoticeImage(): Promise<PickedNoticeImage | null> {
  const imagePath = await pickAndStoreFile(NOTICE_IMAGE_FOLDER, NOTICE_IMAGE_EXTENSIONS, 'Imagen')
  if (!imagePath) return null
  const previewDataUrl = await readStoredFileAsDataUrl(NOTICE_IMAGE_FOLDER, imagePath)
  return { imagePath, previewDataUrl }
}

// Para "quitar imagen" antes de confirmar, o al cancelar el borrador completo: evita dejar
// huérfano el archivo ya copiado si el aviso nunca se termina creando.
export function discardNoticeImage(imagePath: string): Promise<void> {
  return removeStoredFile(NOTICE_IMAGE_FOLDER, imagePath)
}

export function getNoticeImagePreview(imagePath: string): Promise<string> {
  return readStoredFileAsDataUrl(NOTICE_IMAGE_FOLDER, imagePath)
}

// Solo lectura: permite revisar a quién llegaría el aviso antes de confirmarlo.
export function previewNoticeRecipients(
  mode: NoticeMode,
  date: Date
): Promise<NoticeRecipientDetail[]> {
  return resolveRecipients(mode, date)
}

// La imagen ya se eligió (o no) en un paso anterior (pickNoticeImage): este paso solo persiste.
// El envío real por WhatsApp no está implementado todavía: los destinatarios con teléfono
// válido quedan en estado 'pending', a la espera de esa integración.
export async function createNotice(data: NoticeInput): Promise<CreateNoticeResult> {
  const notice: Notice = await createNoticeInDb(data)

  const recipientDetails = await resolveRecipients(data.mode, data.date)
  const recipientInputs = recipientDetails.map((detail) => ({
    noticeId: notice.id,
    studentId: detail.studentId,
    phone: detail.phone,
    status: detail.status
  }))
  const recipients = await createNoticeRecipients(recipientInputs)

  return { notice, recipients: await enrichRecipients(recipients) }
}

export function listNotices(): Promise<Notice[]> {
  return listNoticesInDb()
}

export async function listNoticeRecipients(noticeId: string): Promise<NoticeRecipientDetail[]> {
  const recipients = await listNoticeRecipientsInDb(noticeId)
  return enrichRecipients(recipients)
}
