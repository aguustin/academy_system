import type { UserRole } from './users'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  teacherId?: string
  mustChangePassword: boolean
}

export type LoginResult =
  | { status: 'ok'; user: AuthUser }
  | { status: 'user-not-found' }
  | { status: 'invalid-password' }
  | { status: 'inactive-user' }
