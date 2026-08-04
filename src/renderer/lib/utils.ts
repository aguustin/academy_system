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
