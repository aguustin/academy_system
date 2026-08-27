import { BrowserWindow, dialog } from 'electron'
import { spawn } from 'node:child_process'

// mongodump es la herramienta oficial de MongoDB para backups: funciona igual contra un Mongo
// local o remoto (como el cluster de Atlas que usa hoy esta app) pasándole la misma MONGO_URI
// con la que la app ya se conecta. --archive junto con --gzip vuelca todo en un único archivo
// comprimido, restaurable con "mongorestore --archive=<archivo> --gzip".
// No viene incluida con la app (es un binario aparte, MongoDB Database Tools): si no está
// instalada en la máquina, se informa con un mensaje claro en vez de fallar en silencio.
export async function backupDatabase(): Promise<string | null> {
  const uri = process.env.MONGO_URI
  const dbName = process.env.MONGO_DB_NAME
  if (!uri) {
    throw new Error('Falta la variable de entorno MONGO_URI')
  }

  const saveDialogOptions = {
    defaultPath: `backup-sistema-academico-${new Date().toISOString().slice(0, 10)}.archive.gz`,
    filters: [{ name: 'Backup de MongoDB', extensions: ['gz'] }]
  }
  const parentWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const dialogResult = parentWindow
    ? await dialog.showSaveDialog(parentWindow, saveDialogOptions)
    : await dialog.showSaveDialog(saveDialogOptions)
  if (dialogResult.canceled || !dialogResult.filePath) {
    return null
  }

  // mongodump (Go/go-flags) no parsea de forma confiable "--flag valor" como argumentos
  // separados: con --uri en un token propio termina interpretando la URI también como un
  // argumento posicional suelto ("provide only one MongoDB connection string"). La forma
  // "--flag=valor" en un solo token es la que funciona de manera consistente. Verificado
  // reproduciendo el error directamente contra el binario real antes de este fix.
  const args = [`--uri=${uri}`, `--archive=${dialogResult.filePath}`, '--gzip']
  if (dbName) {
    args.push(`--db=${dbName}`)
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn('mongodump', args)

    let stderr = ''
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        reject(
          new Error(
            'No se encontró la herramienta "mongodump" en esta computadora. Instalá MongoDB Database Tools (mongodb.com/try/download/database-tools) e intentá de nuevo.',
            { cause: error }
          )
        )
        return
      }
      reject(error)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`mongodump terminó con un error (código ${code}): ${stderr.trim()}`))
    })
  })

  return dialogResult.filePath
}
