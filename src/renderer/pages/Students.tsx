import { useCallback, useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import type { Student } from '../../shared/students'
import type { ImportStudentsResult, StudentInput } from '../../shared/electron-api'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { EmptyState } from '../components/ui/empty-state'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Pagination } from '../components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { StudentForm } from '../components/StudentForm'
import { useConfirm } from '../components/ui/confirm-dialog'
import { usePagination } from '../hooks/use-pagination'
import { usePrefillSearch } from '../hooks/use-prefill-search'
import { normalizeText, sortByName } from '../lib/utils'

type ViewMode = { type: 'list' } | { type: 'create' } | { type: 'edit'; student: Student }

export function Students(): React.JSX.Element {
  const confirm = useConfirm()
  const [students, setStudents] = useState<Student[] | null>(null)
  const [mode, setMode] = useState<ViewMode>({ type: 'list' })
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportStudentsResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [search, setSearch] = usePrefillSearch()

  const loadStudents = useCallback(async () => {
    const data = await window.api.student.list()
    setStudents(sortByName(data))
  }, [])

  useEffect(() => {
    window.api.student.list().then((data) => setStudents(sortByName(data)))
  }, [])

  const filteredStudents = (students ?? []).filter((student) => {
    const term = normalizeText(search.trim())
    return normalizeText(student.lastName).includes(term) || student.dni.includes(search.trim())
  })
  const pagination = usePagination(filteredStudents)

  async function handleCreate(values: StudentInput): Promise<void> {
    await window.api.student.create(values)
    setMode({ type: 'list' })
    await loadStudents()
  }

  async function handleUpdate(id: string, values: StudentInput): Promise<void> {
    await window.api.student.update(id, values)
    setMode({ type: 'list' })
    await loadStudents()
  }

  async function handleDelete(id: string): Promise<void> {
    if (!(await confirm('¿Eliminar este alumno?'))) return
    await window.api.student.delete(id)
    await loadStudents()
  }

  async function handleImport(): Promise<void> {
    setImportError(null)
    setImportResult(null)
    setImporting(true)
    try {
      const result = await window.api.student.importFromExcel()
      if (result) {
        setImportResult(result)
        await loadStudents()
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'No se pudo importar el archivo')
    } finally {
      setImporting(false)
    }
  }

  if (mode.type === 'create') {
    return (
      <div className="space-y-6">
        <PageHeader title="Nuevo alumno" />
        <StudentForm onSubmit={handleCreate} onCancel={() => setMode({ type: 'list' })} />
      </div>
    )
  }

  if (mode.type === 'edit') {
    const { student } = mode
    return (
      <div className="space-y-6">
        <PageHeader title="Editar alumno" />
        <StudentForm
          initialValues={student}
          onSubmit={(values) => handleUpdate(student.id, values)}
          onCancel={() => setMode({ type: 'list' })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumnos"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImport} disabled={importing}>
              {importing ? 'Importando...' : 'Importar alumnos'}
            </Button>
            <Button onClick={() => setMode({ type: 'create' })}>Crear alumno</Button>
          </div>
        }
      />

      {importError && (
        <Card className="border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {importError}
        </Card>
      )}

      {importResult && (
        <Card className="p-4 text-sm">
          Importados: {importResult.imported} / Duplicados: {importResult.duplicates} / Inválidos:{' '}
          {importResult.invalid}
        </Card>
      )}

      {students === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No hay alumnos cargados todavía"
          description="Creá el primer alumno para poder inscribirlo en una edición."
          action={<Button onClick={() => setMode({ type: 'create' })}>Crear alumno</Button>}
        />
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="Buscar por apellido o DNI..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-sm"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.lastName} {student.firstName}
                  </TableCell>
                  <TableCell>{student.dni}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMode({ type: 'edit', student })}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(student.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      )}
    </div>
  )
}
