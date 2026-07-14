import { Schema, model, type HydratedDocument } from 'mongoose'
import { userRoleSchema, type User } from '../../shared/users'

type UserDocument = Omit<User, 'id'>

const userSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: userRoleSchema.options, required: true },
    teacherId: { type: String, required: false },
    mustChangePassword: { type: Boolean, required: true },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { collection: 'usuarios' }
)

const UserModel = model<UserDocument>('User', userSchema)

function toUser(doc: HydratedDocument<UserDocument>): User {
  const {
    _id,
    username,
    password,
    email,
    role,
    teacherId,
    mustChangePassword,
    active,
    createdAt,
    updatedAt
  } = doc
  return {
    id: _id.toString(),
    username,
    password,
    email,
    role,
    teacherId,
    mustChangePassword,
    active,
    createdAt,
    updatedAt
  }
}

type CreateUserInput = Omit<UserDocument, 'createdAt' | 'updatedAt'>

export async function createUser(data: CreateUserInput): Promise<User> {
  const now = new Date()
  const doc = await UserModel.create({ ...data, createdAt: now, updatedAt: now })
  return toUser(doc)
}

export async function findUserById(id: string): Promise<User | null> {
  const doc = await UserModel.findById(id)
  return doc ? toUser(doc) : null
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const doc = await UserModel.findOne({ username })
  return doc ? toUser(doc) : null
}

export async function getUsers(): Promise<User[]> {
  const docs = await UserModel.find().sort({ username: 1 })
  return docs.map(toUser)
}

type UpdateUserInput = Partial<Omit<CreateUserInput, 'teacherId'>> & { teacherId?: string | null }

export async function updateUser(id: string, data: UpdateUserInput): Promise<User | null> {
  const { teacherId, ...rest } = data
  const update: Partial<UserDocument> & { $unset?: { teacherId: '' } } = {
    ...rest,
    updatedAt: new Date()
  }
  if (teacherId === null) {
    update.$unset = { teacherId: '' }
  } else if (teacherId !== undefined) {
    update.teacherId = teacherId
  }

  const doc = await UserModel.findByIdAndUpdate(id, update, { new: true })
  return doc ? toUser(doc) : null
}

export async function deleteUser(id: string): Promise<void> {
  await UserModel.findByIdAndDelete(id)
}
