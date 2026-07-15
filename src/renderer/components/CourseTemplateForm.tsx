import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { courseTemplateSchema, type CourseTemplate } from '../../shared/courses'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { FormField } from './ui/form-field'
import { CheckboxField } from './ui/checkbox-field'

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
    <Card className="max-w-md p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Nombre" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
          />
        </FormField>

        <FormField label="Descripción" htmlFor="description" error={errors.description}>
          <Input
            id="description"
            value={values.description}
            onChange={(event) => setValues({ ...values, description: event.target.value })}
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
