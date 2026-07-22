import { existsSync } from 'node:fs'
import { copyFile, mkdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { app, dialog, shell } from 'electron'

function getStorageDir(folder: string): string {
  return path.join(app.getPath('userData'), folder)
}

// Abre el selector nativo de archivos y copia el elegido a userData/<folder>.
// Devuelve el nombre de archivo generado (unico, listo para guardar en Mongo), o null si el
// usuario cancelo el dialogo.
export async function pickAndStoreFile(
  folder: string,
  extensions: string[],
  filterName: string
): Promise<string | null> {
  const dialogResult = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: filterName, extensions }]
  })
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
