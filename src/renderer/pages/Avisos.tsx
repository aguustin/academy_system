import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Megaphone, XCircle } from 'lucide-react'
import type {
  Notice,
  NoticeMode,
  NoticeRecipientDetail,
  PickedNoticeImage
} from '../../shared/notices'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { PageHeader } from '../components/ui/page-header'
import { EmptyState } from '../components/ui/empty-state'
import { FormField } from '../components/ui/form-field'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { parseDateInput } from '../lib/utils'

const MODE_LABELS: Record<NoticeMode, string> = {
  all: 'Enviar a todos',
  'by-date': 'Enviar por fecha concreta'
}

const RECIPIENT_STATUS_LABELS: Record<NoticeRecipientDetail['status'], string> = {
  pending: 'Pendiente de envío',
  'invalid-phone': 'Teléfono inválido'
}

const RECIPIENT_STATUS_VARIANT: Record<
  NoticeRecipientDetail['status'],
  'secondary' | 'destructive'
> = {
  pending: 'secondary',
  'invalid-phone': 'destructive'
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR')
}

function RecipientsTable({
  recipients
}: {
  recipients: NoticeRecipientDetail[]
}): React.JSX.Element {
  const pendingCount = recipients.filter((recipient) => recipient.status === 'pending').length
  const invalidCount = recipients.length - pendingCount

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {recipients.length} destinatarios · {pendingCount} con teléfono válido · {invalidCount} con
        teléfono inválido
      </p>
      {recipients.length === 0 ? (
        <p className="text-sm text-muted-foreground">No se encontró ningún destinatario.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipients.map((recipient) => (
              <TableRow key={recipient.id}>
                <TableCell className="font-medium">{recipient.studentName}</TableCell>
                <TableCell>{recipient.dni}</TableCell>
                <TableCell>{recipient.phone ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={RECIPIENT_STATUS_VARIANT[recipient.status]}>
                    {RECIPIENT_STATUS_LABELS[recipient.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

type DraftStage = { type: 'editing' } | { type: 'reviewing'; recipients: NoticeRecipientDetail[] }

export function Avisos(): React.JSX.Element {
  const [notices, setNotices] = useState<Notice[] | null>(null)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [mode, setMode] = useState<NoticeMode>('all')
  const [pickedImage, setPickedImage] = useState<PickedNoticeImage | null>(null)
  const [pickingImage, setPickingImage] = useState(false)
  const [stage, setStage] = useState<DraftStage>({ type: 'editing' })
  const [reviewing, setReviewing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [viewingNoticeId, setViewingNoticeId] = useState<string | null>(null)
  const [viewingRecipients, setViewingRecipients] = useState<NoticeRecipientDetail[] | null>(null)

  const loadNotices = useCallback(async () => {
    const data = await window.api.notice.list()
    setNotices(data)
  }, [])

  useEffect(() => {
    window.api.notice.list().then(setNotices)
  }, [])

  // Si el admin elige una imagen y abandona la pantalla sin confirmar ni cancelar el borrador
  // (ej: navega a otra sección), el archivo ya copiado a disco quedaría huérfano para siempre.
  const pickedImageRef = useRef<PickedNoticeImage | null>(null)
  useEffect(() => {
    pickedImageRef.current = pickedImage
  }, [pickedImage])
  useEffect(() => {
    return () => {
      if (pickedImageRef.current) {
        void window.api.notice.discardImage(pickedImageRef.current.imagePath)
      }
    }
  }, [])

  async function handlePickImage(): Promise<void> {
    setFeedback(null)
    setPickingImage(true)
    try {
      const result = await window.api.notice.pickImage()
      if (result) setPickedImage(result)
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo abrir el selector de imagen.'
      })
    } finally {
      setPickingImage(false)
    }
  }

  async function handleRemoveImage(): Promise<void> {
    if (pickedImage) await window.api.notice.discardImage(pickedImage.imagePath)
    setPickedImage(null)
  }

  function resetDraft(): void {
    setDescription('')
    setDate('')
    setMode('all')
    setPickedImage(null)
    setStage({ type: 'editing' })
  }

  async function handleCancelDraft(): Promise<void> {
    if (pickedImage) await window.api.notice.discardImage(pickedImage.imagePath)
    resetDraft()
    setFeedback(null)
  }

  async function handleReview(): Promise<void> {
    setFeedback(null)
    setReviewing(true)
    try {
      const recipients = await window.api.notice.previewRecipients(mode, parseDateInput(date))
      setStage({ type: 'reviewing', recipients })
    } finally {
      setReviewing(false)
    }
  }

  async function handleConfirm(): Promise<void> {
    setConfirming(true)
    try {
      const result = await window.api.notice.create({
        description: description.trim(),
        date: parseDateInput(date),
        mode,
        imagePath: pickedImage?.imagePath ?? null
      })
      resetDraft()
      setFeedback({
        type: 'success',
        text: `Aviso creado correctamente. Se registraron ${result.recipients.length} destinatarios.`
      })
      await loadNotices()
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo crear el aviso.'
      })
    } finally {
      setConfirming(false)
    }
  }

  async function handleViewRecipients(notice: Notice): Promise<void> {
    setFeedback(null)
    setViewingNoticeId(notice.id)
    setViewingRecipients(null)
    const data = await window.api.notice.listRecipients(notice.id)
    setViewingRecipients(data)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avisos"
        description="Avisos para alumnos (eventos, suspensiones, novedades), con imagen opcional. El envío automático por WhatsApp se habilita en una próxima etapa: por ahora los destinatarios quedan resueltos y listos."
      />

      {feedback && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-4 text-sm ${
            feedback.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0 translate-y-0.5" />
          ) : (
            <XCircle className="size-4 shrink-0 translate-y-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <Card className="max-w-2xl space-y-4 p-6">
        {stage.type === 'editing' ? (
          <div className="flex flex-col gap-4">
            <FormField label="Descripción" htmlFor="notice-description">
              <Input
                id="notice-description"
                required
                placeholder="Ej: Se suspende la clase del viernes por paro de transporte"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </FormField>

            <div className="flex flex-col gap-4 sm:flex-row">
              <FormField label="Fecha" htmlFor="notice-date">
                <Input
                  id="notice-date"
                  type="date"
                  required
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </FormField>
              <FormField label="Destinatarios" htmlFor="notice-mode">
                <Select
                  id="notice-mode"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as NoticeMode)}
                >
                  <option value="all">{MODE_LABELS.all}</option>
                  <option value="by-date">{MODE_LABELS['by-date']}</option>
                </Select>
              </FormField>
            </div>

            {mode === 'by-date' && (
              <p className="text-sm text-muted-foreground">
                Se les avisa a los alumnos inscriptos en ediciones que tengan una clase generada
                exactamente en esa fecha. Si una clase ya fue cancelada, no se tiene en cuenta.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Imagen (opcional)</span>
              {pickedImage ? (
                <div className="flex items-center gap-3">
                  <img
                    src={pickedImage.previewDataUrl}
                    alt="Vista previa del aviso"
                    className="size-20 rounded-lg border border-border object-cover"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage}>
                    Quitar imagen
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePickImage}
                  disabled={pickingImage}
                  className="self-start"
                >
                  {pickingImage ? 'Abriendo selector...' : 'Adjuntar imagen'}
                </Button>
              )}
            </div>

            <Button
              type="button"
              onClick={handleReview}
              disabled={reviewing || !description.trim() || !date}
              className="self-start"
            >
              {reviewing ? 'Buscando destinatarios...' : 'Revisar aviso'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {description}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatDate(parseDateInput(date))} · {MODE_LABELS[mode]}
              </p>
            </div>

            {pickedImage && (
              <img
                src={pickedImage.previewDataUrl}
                alt="Vista previa del aviso"
                className="max-h-48 w-fit rounded-lg border border-border object-cover"
              />
            )}

            <RecipientsTable recipients={stage.recipients} />

            <div className="flex gap-2">
              <Button onClick={handleConfirm} disabled={confirming}>
                {confirming ? 'Creando...' : 'Confirmar y crear aviso'}
              </Button>
              <Button variant="outline" onClick={handleCancelDraft} disabled={confirming}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Avisos creados</h2>
        {notices === null ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : notices.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No hay avisos creados todavía"
            description="Creá el primer aviso para alumnos desde el formulario de arriba."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Destinatarios</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell className="font-medium">{formatDate(notice.date)}</TableCell>
                  <TableCell className="text-muted-foreground">{notice.description}</TableCell>
                  <TableCell>{MODE_LABELS[notice.mode]}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRecipients(notice)}
                    >
                      Ver destinatarios
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {viewingNoticeId && (
        <Card className="space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Destinatarios</h2>
            <Button variant="outline" size="sm" onClick={() => setViewingNoticeId(null)}>
              Cerrar
            </Button>
          </div>
          {viewingRecipients === null ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <RecipientsTable recipients={viewingRecipients} />
          )}
        </Card>
      )}
    </div>
  )
}
