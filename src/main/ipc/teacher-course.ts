import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { getCourseDetail, listMyCourses } from '../services/teacher-course-service'
import { handleAuthenticated } from '../auth/require-session'

const idSchema = z.string()

export function registerTeacherCourseIpc(): void {
  handleAuthenticated(IPC_CHANNELS.TEACHER_COURSE_LIST_MY_COURSES, () => {
    return listMyCourses()
  })

  handleAuthenticated(
    IPC_CHANNELS.TEACHER_COURSE_GET_DETAIL,
    (_event, courseEditionId: unknown) => {
      return getCourseDetail(idSchema.parse(courseEditionId))
    }
  )
}
