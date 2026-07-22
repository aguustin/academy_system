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
