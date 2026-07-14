import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { teacherSchema, type Teacher } from '../../shared/teachers'
import { Button } from './ui/button'
import { Input } from './ui/input'

const teacherFormSchema = teacherSchema.omit({ id: true, createdAt: true, updatedAt: true })
type TeacherFormValues = z.infer<typeof teacherFormSchema>

interface TeacherFormProps {
  initialValues?: Teacher
  onSubmit: (values: TeacherFormValues) => Promise<void>
  onCancel: () => void
}

export function TeacherForm({
  initialValues,
  onSubmit,
  onCancel
}: TeacherFormProps): React.JSX.Element {
  const [values, setValues] = useState<TeacherFormValues>({
    firstName: initialValues?.firstName ?? '',
    lastName: initialValues?.lastName ?? '',
    dni: initialValues?.dni ?? '',
    email: initialValues?.email ?? '',
    phone: initialValues?.phone ?? '',
    active: initialValues?.active ?? true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()

    const result = teacherFormSchema.safeParse(values)
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
        <label htmlFor="firstName" className="text-sm font-medium">
          Nombre
        </label>
        <Input
          id="firstName"
          value={values.firstName}
          onChange={(event) => setValues({ ...values, firstName: event.target.value })}
        />
        {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lastName" className="text-sm font-medium">
          Apellido
        </label>
        <Input
          id="lastName"
          value={values.lastName}
          onChange={(event) => setValues({ ...values, lastName: event.target.value })}
        />
        {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="dni" className="text-sm font-medium">
          DNI
        </label>
        <Input
          id="dni"
          value={values.dni}
          onChange={(event) => setValues({ ...values, dni: event.target.value })}
        />
        {errors.dni && <p className="text-sm text-destructive">{errors.dni}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Teléfono
        </label>
        <Input
          id="phone"
          value={values.phone}
          onChange={(event) => setValues({ ...values, phone: event.target.value })}
        />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          type="checkbox"
          checked={values.active}
          onChange={(event) => setValues({ ...values, active: event.target.checked })}
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
