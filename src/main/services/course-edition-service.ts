import type { CourseEdition, CourseEditionInput } from '../../shared/courses'
import { updateCourseEdition as updateCourseEditionInDb } from '../db/course-edition'
import { finishInProgressEnrollments } from '../db/enrollment'

// Al guardar una edición con status "finished", las inscripciones que seguían en cursado pasan
// a "finalizó" (ver finishInProgressEnrollments). Llamarlo siempre que status sea "finished" es
// seguro aunque ya estuviera finalizada antes: si no quedan inscripciones "in-progress", el
// update masivo simplemente no afecta a nadie.
export async function updateCourseEdition(
  id: string,
  data: CourseEditionInput
): Promise<CourseEdition | null> {
  const updated = await updateCourseEditionInDb(id, data)
  if (updated && updated.status === 'finished') {
    await finishInProgressEnrollments(id)
  }
  return updated
}
