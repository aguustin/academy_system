import type { AuthUser, LoginResult } from '../../shared/auth'
import type { User } from '../../shared/users'
import { findUserByUsername, updateUser } from '../db/user'
import { comparePassword, hashPassword } from '../auth/password'
import { clearSession, getSession, setSession } from '../auth/session'

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    teacherId: user.teacherId,
    mustChangePassword: user.mustChangePassword
  }
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const user = await findUserByUsername(username)
  if (!user) {
    return { status: 'user-not-found' }
  }
  if (!user.active) {
    return { status: 'inactive-user' }
  }

  const passwordMatches = await comparePassword(password, user.password)
  if (!passwordMatches) {
    return { status: 'invalid-password' }
  }

  const authUser = toAuthUser(user)
  setSession(authUser)
  return { status: 'ok', user: authUser }
}

export function logout(): void {
  clearSession()
}

export function getCurrentUser(): AuthUser | null {
  return getSession()
}

export async function changePassword(newPassword: string): Promise<AuthUser> {
  const session = getSession()
  if (!session) {
    throw new Error('No hay una sesión activa')
  }

  const password = await hashPassword(newPassword)
  const updated = await updateUser(session.id, { password, mustChangePassword: false })
  if (!updated) {
    throw new Error('Usuario no encontrado')
  }

  const authUser = toAuthUser(updated)
  setSession(authUser)
  return authUser
}
