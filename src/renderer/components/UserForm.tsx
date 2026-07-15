import { useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { userRoleSchema, type UserRole } from '../../shared/users'
import type { UserListItem } from '../../shared/electron-api'
import type { Teacher } from '../../shared/teachers'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Card } from './ui/card'
import { FormField } from './ui/form-field'
import { CheckboxField } from './ui/checkbox-field'

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
    <Card className="max-w-md p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Usuario" htmlFor="username" error={errors.username}>
          <Input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>

        {!initialValues && (
          <FormField label="Contraseña inicial" htmlFor="password" error={errors.password}>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
        )}

        <FormField label="Rol" htmlFor="role">
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
        </FormField>

        {role === 'teacher' && (
          <FormField label="Profesor" htmlFor="teacherId" error={errors.teacherId}>
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
          </FormField>
        )}

        <CheckboxField label="Activo" htmlFor="active" checked={active} onChange={setActive} />

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={submitting}>
            {initialValues ? 'Guardar' : 'Crear'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
