import type { User } from '../../shared/users'
import type { UserCreateInput, UserListItem, UserUpdateInput } from '../../shared/electron-api'
import {
  createUser as createUserInDb,
  deleteUser as deleteUserInDb,
  findUserById,
  getUsers,
  updateUser as updateUserInDb
} from '../db/user'
import { createTeacher, findTeacherByDni, findTeacherById, updateTeacher } from '../db/teacher'
import { hashPassword } from '../auth/password'
import { getSession } from '../auth/session'

const RESET_PASSWORD = '123456'

async function toUserListItem(user: User): Promise<UserListItem> {
  const teacher = user.teacherId ? await findTeacherById(user.teacherId) : null
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    teacherId: user.teacherId,
    mustChangePassword: user.mustChangePassword,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    firstName: teacher?.firstName ?? null,
    lastName: teacher?.lastName ?? null,
    dni: teacher?.dni ?? null,
    phone: teacher?.phone ?? null
  }
}

interface TeacherFieldsInput {
  firstName?: string
  lastName?: string
  dni?: string
  phone?: string
}

interface TeacherFields {
  firstName: string
  lastName: string
  dni: string
  phone: string
}

function requireTeacherFields(data: TeacherFieldsInput): TeacherFields {
  const firstName = data.firstName?.trim()
  const lastName = data.lastName?.trim()
  const dni = data.dni?.trim()
  const phone = data.phone?.trim()
  if (!firstName) throw new Error('El nombre es obligatorio')
  if (!lastName) throw new Error('El apellido es obligatorio')
  if (!dni) throw new Error('El DNI es obligatorio')
  if (!phone) throw new Error('El teléfono es obligatorio')
  return { firstName, lastName, dni, phone }
}

async function assertDniNotDuplicated(dni: string, excludeTeacherId?: string): Promise<void> {
  const existing = await findTeacherByDni(dni)
  if (existing && existing.id !== excludeTeacherId) {
    throw new Error(`Ya existe un profesor con el DNI ${dni}`)
  }
}

export async function listUsers(): Promise<UserListItem[]> {
  const users = await getUsers()
  return Promise.all(users.map(toUserListItem))
}

export async function createUser(data: UserCreateInput): Promise<UserListItem> {
  const password = await hashPassword(data.password)

  let teacherId: string | undefined
  if (data.role === 'teacher') {
    const fields = requireTeacherFields(data)
    await assertDniNotDuplicated(fields.dni)
    const teacher = await createTeacher({ ...fields, email: data.email, active: data.active })
    teacherId = teacher.id
  }

  const user = await createUserInDb({
    username: data.username,
    email: data.email,
    password,
    role: data.role,
    teacherId,
    mustChangePassword: true,
    active: data.active
  })
  return toUserListItem(user)
}

export async function updateUser(id: string, data: UserUpdateInput): Promise<UserListItem | null> {
  const existing = await findUserById(id)
  if (!existing) return null

  let teacherId: string | null | undefined
  if (data.role === 'teacher') {
    const fields = requireTeacherFields(data)
    if (existing.role === 'teacher' && existing.teacherId) {
      await assertDniNotDuplicated(fields.dni, existing.teacherId)
      await updateTeacher(existing.teacherId, { ...fields, email: data.email })
      teacherId = existing.teacherId
    } else {
      await assertDniNotDuplicated(fields.dni)
      const teacher = await createTeacher({ ...fields, email: data.email, active: data.active })
      teacherId = teacher.id
    }
  } else if (existing.role === 'teacher') {
    // Tallerista → Administrador: se desvincula el teacherId pero el Teacher nunca se borra,
    // para preservar la integridad histórica de CourseEdition y demás referencias existentes.
    teacherId = null
  }

  const user = await updateUserInDb(id, {
    username: data.username,
    email: data.email,
    role: data.role,
    teacherId,
    active: data.active
  })
  return user ? toUserListItem(user) : null
}

export async function deleteUser(id: string): Promise<void> {
  const session = getSession()
  if (session?.id === id) {
    throw new Error('No podés eliminar tu propio usuario')
  }
  await deleteUserInDb(id)
}

export async function resetPassword(id: string): Promise<void> {
  const password = await hashPassword(RESET_PASSWORD)
  const updated = await updateUserInDb(id, { password, mustChangePassword: true })
  if (!updated) {
    throw new Error('Usuario no encontrado')
  }
}
