// Búsqueda global (Header): busca en paralelo en Alumnos, Docentes y Catálogo de Cursos.
// No incluye Ediciones: no tienen nombre propio, se llega a ellas a través del curso.

export type GlobalSearchResultType = 'student' | 'teacher' | 'courseTemplate'

export interface GlobalSearchResult {
  type: GlobalSearchResultType
  id: string
  title: string
  subtitle: string
  // Texto para precargar el buscador local ya existente de la pantalla de destino.
  prefillSearch: string
}

export interface GlobalSearchResults {
  students: GlobalSearchResult[]
  teachers: GlobalSearchResult[]
  courseTemplates: GlobalSearchResult[]
}
