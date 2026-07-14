import { useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { userRoleSchema, type UserRole } from '../../shared/users'
import type { UserListItem } from '../../shared/electron-api'
import type { Teacher } from '../../shared/teachers'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  teacher: 'Tallerista'
}

const baseFieldsSchema = z.object({
  username: z.string().min(1, 'Requerido'),
  email: z.email(),
  role: userRoleSchema,
  teacherId: z.string().optional(),
  active: z.boolean()
})

const createFormSchema = baseFieldsSchema
  .extend({ password: z.string().min(6, 'Mínimo 6 caracteres') })
  .refine((data) => data.role !== 'teacher' || !!data.teacherId, {
    message: 'Seleccioná un profesor',
    path: ['teacherId']
  })
export type UserCreateFormValues = z.infer<typeof createFormSchema>

const updateFormSchema = baseFieldsSchema.refine(
  (data) => data.role !== 'teacher' || !!data.teacherId,
  { message: 'Seleccioná un profesor', path: ['teacherId'] }
)
export type UserUpdateFormValues = z.infer<typeof updateFormSchema>

interface UserFormProps {
  initialValues?: UserListItem
  onSubmit: (values: UserCreateFormValues | UserUpdateFormValues) => Promise<void>
  onCancel: () => void
}

export function UserForm({ initialValues, onSubmit, onCancel }: UserFormProps): React.JSX.Element {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [username, setUsername] = useState(initialValues?.username ?? '')
  const [email, setEmail] = useState(initialValues?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(initialValues?.role ?? 'teacher')
  const [teacherId, setTeacherId] = useState(initialValues?.teacherId ?? '')
  const [active, setActive] = useState(initialValues?.active ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    window.api.teacher.list().then(setTeachers)
  }, [])

  function handleRoleChange(nextRole: UserRole): void {
    setRole(nextRole)
    if (nextRole !== 'teacher') {
      setTeacherId('')
    }
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()

    const fields = { username, email, role, teacherId: teacherId || undefined, active }
    const result = initialValues
      ? updateFormSchema.safeParse(fields)
      : createFormSchema.safeParse({ ...fields, password })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      await onSubmit(result.data)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm font-medium">
          Usuario
        </label>
        <Input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      {!initialValues && (
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña inicial
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-medium">
          Rol
        </label>
        <Select
          id="role"
          value={role}
          onChange={(event) => handleRoleChange(event.target.value as UserRole)}
        >
          {userRoleSchema.options.map((option) => (
            <option key={option} value={option}>
              {ROLE_LABELS[option]}
            </option>
          ))}
        </Select>
      </div>

      {role === 'teacher' && (
        <div className="flex flex-col gap-1">
          <label htmlFor="teacherId" className="text-sm font-medium">
            Profesor
          </label>
          <Select
            id="teacherId"
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
          >
            <option value="">Seleccionar...</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName}
              </option>
            ))}
          </Select>
          {errors.teacherId && <p className="text-sm text-destructive">{errors.teacherId}</p>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          id="active"
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
          className="size-4 rounded border-input"
        />
        <label htmlFor="active" className="text-sm font-medium">
          Activo
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {initialValues ? 'Guardar' : 'Crear'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
