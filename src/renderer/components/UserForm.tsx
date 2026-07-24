import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { userRoleSchema, type UserRole } from '../../shared/users'
import type { UserListItem } from '../../shared/electron-api'
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
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.email(),
  dni: z.string().optional(),
  phone: z.string().optional(),
  username: z.string().min(1, 'Requerido'),
  role: userRoleSchema,
  active: z.boolean()
})

function checkTeacherFields(data: z.infer<typeof baseFieldsSchema>, ctx: z.RefinementCtx): void {
  if (data.role !== 'teacher') return
  if (!data.firstName?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'El nombre es obligatorio', path: ['firstName'] })
  }
  if (!data.lastName?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'El apellido es obligatorio', path: ['lastName'] })
  }
  if (!data.dni?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'El DNI es obligatorio', path: ['dni'] })
  }
  if (!data.phone?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'El teléfono es obligatorio', path: ['phone'] })
  }
}

const createFormSchema = baseFieldsSchema
  .extend({ password: z.string().min(6, 'Mínimo 6 caracteres') })
  .superRefine(checkTeacherFields)
export type UserCreateFormValues = z.infer<typeof createFormSchema>

const updateFormSchema = baseFieldsSchema.superRefine(checkTeacherFields)
export type UserUpdateFormValues = z.infer<typeof updateFormSchema>

interface UserFormProps {
  initialValues?: UserListItem
  onSubmit: (values: UserCreateFormValues | UserUpdateFormValues) => Promise<void>
  onCancel: () => void
}

export function UserForm({ initialValues, onSubmit, onCancel }: UserFormProps): React.JSX.Element {
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? '')
  const [lastName, setLastName] = useState(initialValues?.lastName ?? '')
  const [email, setEmail] = useState(initialValues?.email ?? '')
  const [dni, setDni] = useState(initialValues?.dni ?? '')
  const [phone, setPhone] = useState(initialValues?.phone ?? '')
  const [username, setUsername] = useState(initialValues?.username ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(initialValues?.role ?? 'teacher')
  const [active, setActive] = useState(initialValues?.active ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()

    const fields = { firstName, lastName, email, dni, phone, username, role, active }
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
    } catch (error) {
      setErrors({ dni: error instanceof Error ? error.message : 'No se pudo guardar el usuario.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="max-w-md p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Nombre" htmlFor="firstName" error={errors.firstName}>
          <Input
            id="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </FormField>

        <FormField label="Apellido" htmlFor="lastName" error={errors.lastName}>
          <Input
            id="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
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

        <FormField label="DNI" htmlFor="dni" error={errors.dni}>
          <Input id="dni" value={dni} onChange={(event) => setDni(event.target.value)} />
        </FormField>

        <FormField label="Teléfono" htmlFor="phone" error={errors.phone}>
          <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </FormField>

        <FormField label="Usuario" htmlFor="username" error={errors.username}>
          <Input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
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
            onChange={(event) => setRole(event.target.value as UserRole)}
          >
            {userRoleSchema.options.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </Select>
        </FormField>

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
