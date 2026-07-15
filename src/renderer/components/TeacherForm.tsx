import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { teacherSchema, type Teacher } from '../../shared/teachers'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { FormField } from './ui/form-field'
import { CheckboxField } from './ui/checkbox-field'

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
    <Card className="max-w-md p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Nombre" htmlFor="firstName" error={errors.firstName}>
          <Input
            id="firstName"
            value={values.firstName}
            onChange={(event) => setValues({ ...values, firstName: event.target.value })}
          />
        </FormField>

        <FormField label="Apellido" htmlFor="lastName" error={errors.lastName}>
          <Input
            id="lastName"
            value={values.lastName}
            onChange={(event) => setValues({ ...values, lastName: event.target.value })}
          />
        </FormField>

        <FormField label="DNI" htmlFor="dni" error={errors.dni}>
          <Input
            id="dni"
            value={values.dni}
            onChange={(event) => setValues({ ...values, dni: event.target.value })}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
          />
        </FormField>

        <FormField label="Teléfono" htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            value={values.phone}
            onChange={(event) => setValues({ ...values, phone: event.target.value })}
          />
        </FormField>

        <CheckboxField
          label="Activo"
          htmlFor="active"
          checked={values.active}
          onChange={(checked) => setValues({ ...values, active: checked })}
        />

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
