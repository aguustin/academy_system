import type { User } from '../../shared/users'
import type {
  ResetPasswordResult,
  UserCreateInput,
  UserListItem,
  UserUpdateInput
} from '../../shared/electron-api'
import {
  createUser as createUserInDb,
  deleteUser as deleteUserInDb,
  getUsers,
  updateUser as updateUserInDb
} from '../db/user'
import { hashPassword } from '../auth/password'
import { getSession } from '../auth/session'

function toUserListItem(user: User): UserListItem {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    teacherId: user.teacherId,
    mustChangePassword: user.mustChangePassword,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

function generateTemporaryPassword(): string {
  return Math.random().toString(36).slice(-8)
}

export async function listUsers(): Promise<UserListItem[]> {
  const users = await getUsers()
  return users.map(toUserListItem)
}

export async function createUser(data: UserCreateInput): Promise<UserListItem> {
  const password = await hashPassword(data.password)
  const user = await createUserInDb({
    username: data.username,
    email: data.email,
    password,
    role: data.role,
    teacherId: data.role === 'teacher' ? data.teacherId : undefined,
    mustChangePassword: true,
    active: data.active
  })
  return toUserListItem(user)
}

export async function updateUser(id: string, data: UserUpdateInput): Promise<UserListItem | null> {
  const user = await updateUserInDb(id, {
    username: data.username,
    email: data.email,
    role: data.role,
    teacherId: data.role === 'teacher' ? data.teacherId : null,
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

export async function resetPassword(id: string): Promise<ResetPasswordResult> {
  const temporaryPassword = generateTemporaryPassword()
  const password = await hashPassword(temporaryPassword)
  const updated = await updateUserInDb(id, { password, mustChangePassword: true })
  if (!updated) {
    throw new Error('Usuario no encontrado')
  }
  return { temporaryPassword }
}
