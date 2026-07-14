import { useState } from 'react'
import { MyCourses } from '../components/MyCourses'
import { CourseDetail } from '../components/CourseDetail'

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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mis Cursos</h1>
      <MyCourses onSelect={(courseEditionId) => setMode({ type: 'detail', courseEditionId })} />
    </div>
  )
}
