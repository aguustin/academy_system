import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { app, BrowserWindow, dialog, shell } from 'electron'

function getStorageDir(folder: string): string {
  return path.join(app.getPath('userData'), folder)
}

const IMAGE_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
}

// Abre el selector nativo de archivos y copia el elegido a userData/<folder>.
// Devuelve el nombre de archivo generado (unico, listo para guardar en Mongo), o null si el
// usuario cancelo el dialogo.
export async function pickAndStoreFile(
  folder: string,
  extensions: string[],
  filterName: string
): Promise<string | null> {
  // Sin la ventana padre, en Windows el foco de teclado a veces no vuelve correctamente al
  // cerrar el diálogo nativo, dejando inputs y selects sin responder (los clics siguen andando).
  const options = { properties: ['openFile' as const], filters: [{ name: filterName, extensions }] }
  const parentWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const dialogResult = parentWindow
    ? await dialog.showOpenDialog(parentWindow, options)
    : await dialog.showOpenDialog(options)
  if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
    return null
  }

  const storageDir = getStorageDir(folder)
  await mkdir(storageDir, { recursive: true })

  const sourcePath = dialogResult.filePaths[0]
  const fileName = `${Date.now()}-${path.basename(sourcePath)}`
  await copyFile(sourcePath, path.join(storageDir, fileName))
  return fileName
}

export async function removeStoredFile(folder: string, fileName: string): Promise<void> {
  const filePath = path.join(getStorageDir(folder), fileName)
  if (existsSync(filePath)) {
    await unlink(filePath)
  }
}

export async function openStoredFile(folder: string, fileName: string): Promise<void> {
  const filePath = path.join(getStorageDir(folder), fileName)
  const errorMessage = await shell.openPath(filePath)
  if (errorMessage) {
    throw new Error(errorMessage)
  }
}

// El renderer no tiene acceso al sistema de archivos: para previsualizar una imagen (recién
// elegida o de un aviso ya creado) hay que mandarle el contenido como data URL por IPC.
export async function readStoredFileAsDataUrl(folder: string, fileName: string): Promise<string> {
  const filePath = path.join(getStorageDir(folder), fileName)
  const buffer = await readFile(filePath)
  const mimeType =
    IMAGE_MIME_TYPES[path.extname(fileName).toLowerCase()] ?? 'application/octet-stream'
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}
