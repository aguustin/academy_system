import type { AuthUser } from '../../shared/auth'

let currentUser: AuthUser | null = null

export function setSession(user: AuthUser): void {
  currentUser = user
}

export function clearSession(): void {
  currentUser = null
}

export function getSession(): AuthUser | null {
  return currentUser
}
