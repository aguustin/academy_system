import { config } from 'dotenv'
import { app } from 'electron'
import path from 'node:path'
import mongoose from 'mongoose'

// En desarrollo, dotenv toma .env desde el directorio del proyecto (comportamiento
// por defecto). Empaquetada, la app puede arrancar con cualquier working directory,
// así que se apunta explícitamente al .env embebido junto al ejecutable.
config({
  quiet: true,
  path: app.isPackaged ? path.join(process.resourcesPath, '.env') : undefined
})

let connectionPromise: Promise<typeof mongoose> | null = null

export function connectToDatabase(): Promise<typeof mongoose> {
  if (!connectionPromise) {
    const uri = process.env.MONGO_URI
    const dbName = process.env.MONGO_DB_NAME

    connectionPromise = uri
      ? mongoose.connect(uri, { dbName })
      : Promise.reject(new Error('Falta la variable de entorno MONGO_URI'))
  }

  return connectionPromise
}
