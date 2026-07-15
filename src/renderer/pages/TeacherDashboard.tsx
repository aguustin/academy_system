import { useState } from 'react'
import { MyCourses } from '../components/MyCourses'
import { CourseDetail } from '../components/CourseDetail'
import { PageHeader } from '../components/ui/page-header'

type ViewMode = { type: 'list' } | { type: 'detail'; courseEditionId: string }

export function TeacherDashboard(): React.JSX.Element {
  const [mode, setMode] = useState<ViewMode>({ type: 'list' })

  if (mode.type === 'detail') {
    return (
      <CourseDetail
        courseEditionId={mode.courseEditionId}
        onBack={() => setMode({ type: 'list' })}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Cursos" description="Cursos que tenés asignados como tallerista." />
      <MyCourses onSelect={(courseEditionId) => setMode({ type: 'detail', courseEditionId })} />
    </div>
  )
}
