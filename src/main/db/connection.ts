import { config } from 'dotenv'
import mongoose from 'mongoose'

config({ quiet: true })

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
