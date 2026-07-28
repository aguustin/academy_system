import { dialog } from 'electron'
import ExcelJS from 'exceljs'
import { z } from 'zod'
import { studentSchema, type Student } from '../../shared/students'
import type { ImportStudentsResult, StudentInput } from '../../shared/electron-api'
import { mongoStudentProvider } from '../providers/mongo-student-provider'

export async function createStudent(data: StudentInput): Promise<Student> {
  const existing = await mongoStudentProvider.findByDni(data.dni)
  if (existing) {
    throw new Error(`Ya existe un alumno con el DNI ${data.dni}`)
  }
  return mongoStudentProvider.create(data)
}

export async function updateStudent(id: string, data: StudentInput): Promise<Student | null> {
  const existing = await mongoStudentProvider.findByDni(data.dni)
  if (existing && existing.id !== id) {
    throw new Error(`Ya existe un alumno con el DNI ${data.dni}`)
  }
  return mongoStudentProvider.update(id, data)
}

export async function deleteStudent(id: string): Promise<void> {
  await mongoStudentProvider.delete(id)
}

// Fila de Excel: igual que StudentInput, pero exige que los textos no vengan vacíos (el schema
// compartido usa z.string() sin mínimo, ya que allí no aplica para un formulario ya validado por UI).
const importRowSchema = studentSchema.omit({ id: true }).extend({
  dni: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
})

const REQUIRED_COLUMNS = ['CORREO', 'APELLIDO', 'NOMBRE', 'DNI', 'CELULAR'] as const

function cellToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim()
    if ('result' in value) return cellToText((value as { result: ExcelJS.CellValue }).result)
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText
        .map((part) => part.text)
        .join('')
        .trim()
    }
    return ''
  }
  return String(value).trim()
}

// Toda la lectura del archivo ocurre en el proceso principal: el renderer solo dispara la
// importación y recibe el resumen final (Importados/Duplicados/Inválidos).
export async function importStudentsFromExcel(): Promise<ImportStudentsResult | null> {
  const dialogResult = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }]
  })
  if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
    return null
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(dialogResult.filePaths[0])
  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new Error('El archivo no contiene ninguna hoja para importar')
  }

  const columnIndex = new Map<string, number>()
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    columnIndex.set(cellToText(cell.value).toUpperCase(), colNumber)
  })

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columnIndex.has(column))
  if (missingColumns.length > 0) {
    throw new Error(`Faltan columnas obligatorias: ${missingColumns.join(', ')}`)
  }

  function cellByColumn(row: ExcelJS.Row, column: string): string {
    const index = columnIndex.get(column)
    return index === undefined ? '' : cellToText(row.getCell(index).value)
  }

  const dataRows: ExcelJS.Row[] = []
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return
    dataRows.push(row)
  })

  const existingDnis = new Set((await mongoStudentProvider.getAll()).map((student) => student.dni))

  let imported = 0
  let duplicates = 0
  let invalid = 0

  for (const row of dataRows) {
    const candidate = {
      email: cellByColumn(row, 'CORREO'),
      lastName: cellByColumn(row, 'APELLIDO'),
      firstName: cellByColumn(row, 'NOMBRE'),
      dni: cellByColumn(row, 'DNI'),
      phone: Number(cellByColumn(row, 'CELULAR'))
    }

    const parsed = importRowSchema.safeParse(candidate)
    if (!parsed.success) {
      invalid++
      continue
    }

    if (existingDnis.has(parsed.data.dni)) {
      duplicates++
      continue
    }

    await mongoStudentProvider.create(parsed.data)
    existingDnis.add(parsed.data.dni)
    imported++
  }

  return { imported, duplicates, invalid }
}
