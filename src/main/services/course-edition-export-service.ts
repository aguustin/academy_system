import { BrowserWindow, dialog } from 'electron'
import ExcelJS from 'exceljs'
import { findCourseEditionById } from '../db/course-edition'
import { findCourseTemplateById } from '../db/course-template'
import { listEnrollmentsByCourseEdition } from '../db/enrollment'
import { findAttendanceByCourseEdition } from '../db/attendance'
import { mongoStudentProvider } from '../providers/mongo-student-provider'
import { listClassSessionsByEdition } from './class-session-service'
import { computeAttendanceStats } from './attendance-service'

const SHEET_NAME_MAX_LENGTH = 31
// Cuántos caracteres del final del nombre se preservan siempre al recortar: ahí suelen ir los
// sufijos que distinguen ediciones parecidas (turno tarde/mañana, comisión, etc.), por ejemplo
// "- TT"/"- TM". El resto del presupuesto de 31 caracteres se usa para el principio del nombre.
const SHEET_NAME_TAIL_LENGTH = 13

// Los nombres de hoja de Excel no admiten \ / ? * [ ] : y tienen un máximo de 31 caracteres. Si
// hay que recortar, se conserva el principio Y el final del nombre (con "…" en el medio) en vez
// de cortar todo lo que sobra desde el final, que es justo donde suele ir lo que diferencia a una
// edición de otra con nombre casi idéntico.
function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, ' ').trim() || 'Edición'
  if (cleaned.length <= SHEET_NAME_MAX_LENGTH) return cleaned

  const headLength = SHEET_NAME_MAX_LENGTH - SHEET_NAME_TAIL_LENGTH - 1 // -1 por el "…"
  const head = cleaned.slice(0, headLength).trimEnd()
  const tail = cleaned.slice(-SHEET_NAME_TAIL_LENGTH).trimStart()
  return `${head}…${tail}`
}

// Excel compara nombres de hoja sin distinguir mayúsculas de minúsculas: si dos ediciones
// exportadas juntas comparten el mismo nombre de curso (aunque difieran solo en el case), se
// numeran para que cada una tenga su propia hoja sin pisar a la anterior.
function uniqueSheetName(baseName: string, usedNormalizedNames: Set<string>): string {
  const sanitized = sanitizeSheetName(baseName)

  let candidate = sanitized
  let suffix = 2
  while (usedNormalizedNames.has(candidate.toUpperCase())) {
    const suffixText = ` (${suffix})`
    candidate = `${sanitized.slice(0, SHEET_NAME_MAX_LENGTH - suffixText.length)}${suffixText}`
    suffix++
  }
  return candidate
}

// Genera un Excel con una hoja por edición: nombre de la edición, alumnos inscriptos ordenados
// por apellido, y su total de clases/asistencias/faltas. Devuelve la ruta guardada, o null si el
// usuario canceló el diálogo de guardado.
export async function exportCourseEditionsAttendance(
  courseEditionIds: string[]
): Promise<string | null> {
  if (courseEditionIds.length === 0) {
    throw new Error('Seleccioná al menos una edición para exportar')
  }

  const saveDialogOptions = {
    defaultPath: `asistencias-ediciones-${new Date().toISOString().slice(0, 10)}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  }
  const parentWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const dialogResult = parentWindow
    ? await dialog.showSaveDialog(parentWindow, saveDialogOptions)
    : await dialog.showSaveDialog(saveDialogOptions)
  if (dialogResult.canceled || !dialogResult.filePath) {
    return null
  }

  const workbook = new ExcelJS.Workbook()
  const usedNormalizedSheetNames = new Set<string>()

  for (const courseEditionId of courseEditionIds) {
    const courseEdition = await findCourseEditionById(courseEditionId)
    if (!courseEdition) continue

    const courseTemplate = await findCourseTemplateById(courseEdition.templateId)
    const editionName = courseTemplate?.name ?? courseEdition.templateId

    const sheetName = uniqueSheetName(editionName, usedNormalizedSheetNames)
    usedNormalizedSheetNames.add(sheetName.toUpperCase())

    const worksheet = workbook.addWorksheet(sheetName)
    worksheet.columns = [
      { width: 20 },
      { width: 20 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 12 }
    ]
    worksheet.addRow([`Edición: ${editionName}`])
    worksheet.addRow([])
    const headerRow = worksheet.addRow([
      'Apellido',
      'Nombre',
      'DNI',
      'Clases totales',
      'Asistencias',
      'Inasistencias'
    ])
    headerRow.font = { bold: true }

    const [enrollments, classSessions, attendanceRecords] = await Promise.all([
      listEnrollmentsByCourseEdition(courseEditionId),
      listClassSessionsByEdition(courseEditionId),
      findAttendanceByCourseEdition(courseEditionId)
    ])

    const students = (
      await Promise.all(
        enrollments.map((enrollment) => mongoStudentProvider.findById(enrollment.studentId))
      )
    ).filter((student): student is NonNullable<typeof student> => student !== null)

    students.sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName, 'es') || a.firstName.localeCompare(b.firstName, 'es')
    )

    for (const student of students) {
      // usedAbsences ya calcula las faltas solo sobre las clases con fecha anterior o igual a
      // "hoy" (el momento de la exportación), sin contar clases futuras que todavía no pasaron.
      const stats = computeAttendanceStats(
        classSessions,
        attendanceRecords,
        student.id,
        courseEdition.minimumAttendancePercentage
      )
      worksheet.addRow([
        student.lastName,
        student.firstName,
        student.dni,
        stats.totalClasses,
        stats.attendanceCount,
        stats.usedAbsences
      ])
    }
  }

  try {
    await workbook.xlsx.writeFile(dialogResult.filePath)
  } catch (error) {
    // EBUSY: el archivo elegido está abierto en Excel u otro programa que lo tiene bloqueado en
    // Windows. Es un error esperable (no un bug), así que se traduce a un mensaje accionable.
    if (error instanceof Error && 'code' in error && error.code === 'EBUSY') {
      throw new Error(
        'No se pudo guardar el archivo porque está abierto en Excel u otro programa. Cerralo e intentá exportar de nuevo.',
        { cause: error }
      )
    }
    throw error
  }

  return dialogResult.filePath
}
