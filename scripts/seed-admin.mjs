// Script de bootstrap: crea el primer usuario administrador en la base de datos.
// No forma parte del CRUD de usuarios (fuera de alcance del Ticket 013); es la
// única forma de obtener un usuario para probar el login mientras esa pantalla
// no exista. Se ejecuta manualmente una sola vez: `npm run seed:admin`.
import { config } from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

config({ quiet: true })

const username = process.env.SEED_ADMIN_USERNAME ?? 'admin'
const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234'
const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@instituto.local'

const uri = process.env.MONGO_URI
const dbName = process.env.MONGO_DB_NAME
if (!uri) {
  throw new Error('Falta la variable de entorno MONGO_URI')
}

await mongoose.connect(uri, { dbName })

const usersCollection = mongoose.connection.collection('usuarios')

const existing = await usersCollection.findOne({ username })
if (existing) {
  console.log(`El usuario "${username}" ya existe. No se creó ningún usuario nuevo.`)
} else {
  const now = new Date()
  await usersCollection.insertOne({
    username,
    password: await bcrypt.hash(password, 10),
    email,
    role: 'admin',
    mustChangePassword: true,
    active: true,
    createdAt: now,
    updatedAt: now
  })
  console.log(`Usuario administrador creado: ${username} / ${password}`)
  console.log('Se le pedirá cambiar la contraseña en el primer inicio de sesión.')
}

await mongoose.disconnect()
