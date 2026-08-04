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

// Los nombres de hoja de Excel no admiten \ / ? * [ ] : y tienen un máximo de 31 caracteres.
function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, ' ').trim()
  return cleaned.slice(0, SHEET_NAME_MAX_LENGTH) || 'Edición'
}

// Si dos ediciones exportadas juntas comparten el mismo nombre de curso, se numeran para que
// cada una tenga su propia hoja sin pisar a la anterior.
function uniqueSheetName(baseName: string, usedNames: Set<string>): string {
  const sanitized = sanitizeSheetName(baseName)
  if (!usedNames.has(sanitized)) return sanitized

  let suffix = 2
  let candidate: string
  do {
    const suffixText = ` (${suffix})`
    candidate = `${sanitized.slice(0, SHEET_NAME_MAX_LENGTH - suffixText.length)}${suffixText}`
    suffix++
  } while (usedNames.has(candidate))
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
  const usedSheetNames = new Set<string>()

  for (const courseEditionId of courseEditionIds) {
    const courseEdition = await findCourseEditionById(courseEditionId)
    if (!courseEdition) continue

    const courseTemplate = await findCourseTemplateById(courseEdition.templateId)
    const editionName = courseTemplate?.name ?? courseEdition.templateId

    const sheetName = uniqueSheetName(editionName, usedSheetNames)
    usedSheetNames.add(sheetName)

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
      'Faltas'
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
      const stats = computeAttendanceStats(classSessions, attendanceRecords, student.id)
      worksheet.addRow([
        student.lastName,
        student.firstName,
        student.dni,
        stats.totalClasses,
        stats.attendanceCount,
        stats.totalClasses - stats.attendanceCount
      ])
    }
  }

  await workbook.xlsx.writeFile(dialogResult.filePath)
  return dialogResult.filePath
}
