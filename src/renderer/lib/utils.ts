import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Los archivos adjuntos (programa de curso, PDF de evaluacion) se guardan como
// `${timestamp}-${nombreOriginal}`; esto recupera el nombre original para mostrarlo.
export function stripTimestampPrefix(fileName: string): string {
  return fileName.replace(/^\d+-/, '')
}

export function sortByName<T extends { firstName: string; lastName: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      a.lastName.localeCompare(b.lastName, 'es') || a.firstName.localeCompare(b.firstName, 'es')
  )
}

const DIACRITICS_PATTERN = new RegExp('[̀-ͯ]', 'g')

// Quita diacríticos (tildes, diéresis) para que la búsqueda no distinga "García" de "Garcia".
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS_PATTERN, '').toLowerCase()
}

export function sortByDateDesc<T>(items: T[], getDate: (item: T) => Date): T[] {
  return [...items].sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime())
}

// Orden alfabético A-Z genérico por un campo de texto (nombres de curso, evaluación, etc.).
// localeCompare con 'es' evita que Mongo (orden binario) ordene mal mayúsculas o letras con tilde.
export function sortByField<T>(items: T[], getField: (item: T) => string): T[] {
  return [...items].sort((a, b) => getField(a).localeCompare(getField(b), 'es'))
}

// Un <input type="date"> da "YYYY-MM-DD"; `new Date(...)` de ese string lo interpreta como
// medianoche UTC, que en husos horarios negativos (ej. Argentina) cae en el día calendario
// anterior en hora local. Se arma la fecha a mano en hora local para que coincida con el
// mismo día que las fechas de las clases (ver toUtcDateOnly en class-session-service.ts).
export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Los profesores pueden escribir notas con coma o punto como separador decimal (7,5 o 7.5);
// se normaliza a punto antes de convertir a number, el único formato que entiende Number().
export function parseGradeInput(value: string): number {
  return Number(value.replace(',', '.'))
}
