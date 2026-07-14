import { useCallback, useEffect, useState } from 'react'
import type { UserListItem } from '../../shared/electron-api'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import {
  UserForm,
  type UserCreateFormValues,
  type UserUpdateFormValues
} from '../components/UserForm'

type ViewMode = { type: 'list' } | { type: 'create' } | { type: 'edit'; user: UserListItem }

const ROLE_LABELS = {
  admin: 'Administrador',
  teacher: 'Tallerista'
} as const

export function Users(): React.JSX.Element {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserListItem[] | null>(null)
  const [mode, setMode] = useState<ViewMode>({ type: 'list' })

  const loadUsers = useCallback(async () => {
    const data = await window.api.user.list()
    setUsers(data)
  }, [])

  useEffect(() => {
    window.api.user.list().then(setUsers)
  }, [])

  async function handleCreate(values: UserCreateFormValues): Promise<void> {
    await window.api.user.create(values)
    setMode({ type: 'list' })
    await loadUsers()
  }

  async function handleUpdate(id: string, values: UserUpdateFormValues): Promise<void> {
    await window.api.user.update(id, values)
    setMode({ type: 'list' })
    await loadUsers()
  }

  async function handleDelete(user: UserListItem): Promise<void> {
    if (user.id === currentUser?.id) {
      window.alert('No podés eliminar tu propio usuario.')
      return
    }
    if (!window.confirm(`¿Eliminar al usuario "${user.username}"?`)) return
    try {
      await window.api.user.delete(user.id)
      await loadUsers()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el usuario.')
    }
  }

  async function handleResetPassword(user: UserListItem): Promise<void> {
    if (!window.confirm(`¿Restablecer la contraseña de "${user.username}"?`)) return
    const { temporaryPassword } = await window.api.user.resetPassword(user.id)
    window.alert(
      `Contraseña temporal para "${user.username}": ${temporaryPassword}\n\n` +
        'Se le pedirá cambiarla en su próximo inicio de sesión.'
    )
    await loadUsers()
  }

  if (mode.type === 'create') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nuevo usuario</h1>
        <UserForm
          onSubmit={(values) => handleCreate(values as UserCreateFormValues)}
          onCancel={() => setMode({ type: 'list' })}
        />
      </div>
    )
  }

  if (mode.type === 'edit') {
    const { user } = mode
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Editar usuario</h1>
        <UserForm
          initialValues={user}
          onSubmit={(values) => handleUpdate(user.id, values as UserUpdateFormValues)}
          onCancel={() => setMode({ type: 'list' })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <Button onClick={() => setMode({ type: 'create' })}>Crear usuario</Button>
      </div>

      {users === null ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground">No hay usuarios cargados todavía.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                <TableCell>{user.active ? 'Sí' : 'No'}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMode({ type: 'edit', user })}
                  >
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleResetPassword(user)}>
                    Restablecer contraseña
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    disabled={user.id === currentUser?.id}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
