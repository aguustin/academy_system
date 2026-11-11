import { z } from 'zod'

// 'all': todos los alumnos con al menos una inscripción. 'by-date': solo los inscriptos en
// ediciones que tengan una clase generada exactamente en la fecha del aviso.
export const noticeModeSchema = z.enum(['all', 'by-date'])
export type NoticeMode = z.infer<typeof noticeModeSchema>

export const noticeSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  date: z.date(),
  mode: noticeModeSchema,
  // Ruta relativa (dentro de userData/notices) de la imagen adjunta, o null si el aviso no
  // tiene imagen (es opcional). El archivo nunca se guarda en Mongo; los avisos se crean
  // siempre desde la misma PC, así que no hace falta compartirla.
  imagePath: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type Notice = z.infer<typeof noticeSchema>

export const noticeInputSchema = noticeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
export type NoticeInput = z.infer<typeof noticeInputSchema>

// 'pending': destinatario resuelto con teléfono válido, a la espera del envío (todavía no hay
// integración real con WhatsApp). 'invalid-phone': el alumno no tiene un teléfono utilizable.
export const noticeRecipientStatusSchema = z.enum(['pending', 'invalid-phone'])
export type NoticeRecipientStatus = z.infer<typeof noticeRecipientStatusSchema>

export interface NoticeRecipient {
  id: string
  noticeId: string
  studentId: string
  // Teléfono ya normalizado al formato de WhatsApp (549 + código de área + número), o null si
  // no se pudo normalizar.
  phone: string | null
  status: NoticeRecipientStatus
  createdAt: Date
}

// DTO de solo lectura (no se persiste): combina el destinatario con los datos del alumno para
// mostrarlo en la pantalla de Avisos. Se usa tanto para la vista previa (antes de confirmar)
// como para los destinatarios ya guardados de un aviso existente.
export interface NoticeRecipientDetail {
  id: string
  studentId: string
  studentName: string
  dni: string
  phone: string | null
  status: NoticeRecipientStatus
}

export interface CreateNoticeResult {
  notice: Notice
  recipients: NoticeRecipientDetail[]
}

// Resultado de elegir una imagen antes de confirmar el aviso: el archivo ya quedó copiado a
// almacenamiento local (imagePath), y previewDataUrl permite mostrarla sin que el renderer
// acceda al sistema de archivos.
export interface PickedNoticeImage {
  imagePath: string
  previewDataUrl: string
}
