import type { GlobalSearchResult, GlobalSearchResults } from '../../shared/search'
import { getStudents } from '../db/student'
import { getCourseTemplates } from '../db/course-template'
import { listUsers } from './user-service'

const MIN_QUERY_LENGTH = 2
const MAX_RESULTS_PER_GROUP = 5

const DIACRITICS_PATTERN = new RegExp('[̀-ͯ]', 'g')

// Duplicado intencional de normalizeText (src/renderer/lib/utils.ts): es un helper de una línea
// y este archivo corre en el proceso main, que no debe importar código del renderer.
function normalizeText(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS_PATTERN, '').toLowerCase()
}

export async function searchGlobal(query: string): Promise<GlobalSearchResults> {
  const trimmed = query.trim()
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return { students: [], teachers: [], courseTemplates: [] }
  }

  const normalizedQuery = normalizeText(trimmed)
  const [students, users, courseTemplates] = await Promise.all([
    getStudents(),
    listUsers(),
    getCourseTemplates()
  ])

  const matchingStudents: GlobalSearchResult[] = students
    .filter(
      (student) =>
        normalizeText(student.lastName).includes(normalizedQuery) ||
        normalizeText(student.firstName).includes(normalizedQuery) ||
        student.dni.includes(trimmed)
    )
    .slice(0, MAX_RESULTS_PER_GROUP)
    .map((student) => ({
      type: 'student',
      id: student.id,
      title: `${student.lastName} ${student.firstName}`,
      subtitle: `DNI ${student.dni}`,
      prefillSearch: student.lastName
    }))

  const matchingTeachers: GlobalSearchResult[] = users
    .filter((user) => user.role === 'teacher')
    .filter(
      (user) =>
        normalizeText(user.lastName ?? '').includes(normalizedQuery) ||
        normalizeText(user.firstName ?? '').includes(normalizedQuery) ||
        (user.dni ?? '').includes(trimmed) ||
        normalizeText(user.username).includes(normalizedQuery)
    )
    .slice(0, MAX_RESULTS_PER_GROUP)
    .map((user) => ({
      type: 'teacher',
      id: user.id,
      title: user.lastName && user.firstName ? `${user.lastName} ${user.firstName}` : user.username,
      subtitle: user.dni ? `DNI ${user.dni}` : user.username,
      prefillSearch: user.lastName ?? user.username
    }))

  const matchingCourseTemplates: GlobalSearchResult[] = courseTemplates
    .filter((courseTemplate) => normalizeText(courseTemplate.name).includes(normalizedQuery))
    .slice(0, MAX_RESULTS_PER_GROUP)
    .map((courseTemplate) => ({
      type: 'courseTemplate',
      id: courseTemplate.id,
      title: courseTemplate.name,
      subtitle: courseTemplate.active ? 'Activo' : 'Inactivo',
      prefillSearch: courseTemplate.name
    }))

  return {
    students: matchingStudents,
    teachers: matchingTeachers,
    courseTemplates: matchingCourseTemplates
  }
}
