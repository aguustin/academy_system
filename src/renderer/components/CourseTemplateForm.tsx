import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { courseTemplateSchema, type CourseTemplate } from '../../shared/courses'
import { Button } from './ui/button'
import { Input } from './ui/input'

const courseTemplateFormSchema = courseTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  programFile: true
})
type CourseTemplateFormValues = z.infer<typeof courseTemplateFormSchema>

interface CourseTemplateFormProps {
  initialValues?: CourseTemplate
  onSubmit: (values: CourseTemplateFormValues) => Promise<void>
  onCancel: () => void
}

export function CourseTemplateForm({
  initialValues,
  onSubmit,
  onCancel
}: CourseTemplateFormProps): React.JSX.Element {
  const [values, setValues] = useState<CourseTemplateFormValues>({
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    active: initialValues?.active ?? true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()

    const result = courseTemplateFormSchema.safeParse(values)
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
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>
        <Input
          id="description"
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
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
