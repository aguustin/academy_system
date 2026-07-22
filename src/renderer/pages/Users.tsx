import { useCallback, useEffect, useState } from 'react'
import { UserCog } from 'lucide-react'
import type { UserListItem } from '../../shared/electron-api'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'
import { EmptyState } from '../components/ui/empty-state'
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
    await window.api.user.resetPassword(user.id)
    window.alert('Contraseña restablecida correctamente.')
    await loadUsers()
  }

  if (mode.type === 'create') {
    return (
      <div className="space-y-6">
        <PageHeader title="Nuevo usuario" />
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
      <div className="space-y-6">
        <PageHeader title="Editar usuario" />
        <UserForm
          initialValues={user}
          onSubmit={(values) => handleUpdate(user.id, values as UserUpdateFormValues)}
          onCancel={() => setMode({ type: 'list' })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        action={<Button onClick={() => setMode({ type: 'create' })}>Crear usuario</Button>}
      />

      {users === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No hay usuarios cargados todavía"
          description="Creá el primer usuario para dar acceso a la aplicación."
          action={<Button onClick={() => setMode({ type: 'create' })}>Crear usuario</Button>}
        />
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
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.active ? 'success' : 'secondary'}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
