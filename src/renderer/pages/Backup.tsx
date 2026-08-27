import { useState } from 'react'
import { DatabaseBackup } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'

export function Backup(): React.JSX.Element {
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleBackup(): Promise<void> {
    setMessage(null)
    setGenerating(true)
    try {
      const filePath = await window.api.backup.create()
      if (filePath) {
        setMessage({ type: 'success', text: `Backup generado correctamente en: ${filePath}` })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo generar el backup.'
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup de base de datos"
        description="Genera una copia completa de la base de datos en un archivo, sin modificar ni eliminar información."
      />

      <Card className="max-w-xl space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <DatabaseBackup className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Generar backup</p>
            <p className="text-sm text-muted-foreground">
              Se te va a pedir elegir dónde guardar el archivo. Requiere tener instalado «MongoDB
              Database Tools» en esta computadora.
            </p>
          </div>
        </div>

        <Button onClick={handleBackup} disabled={generating}>
          {generating ? 'Generando backup...' : 'Generar backup'}
        </Button>

        {message && (
          <p
            className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-destructive'}`}
          >
            {message.text}
          </p>
        )}
      </Card>
    </div>
  )
}
