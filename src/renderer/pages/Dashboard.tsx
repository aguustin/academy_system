import { useEffect, useState } from 'react'
import { PageHeader } from '../components/ui/page-header'

export function Dashboard(): React.JSX.Element {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    window.api.system.getVersion().then(setVersion)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bienvenido al Sistema Académico"
        description={
          version ? `Versión de la aplicación: ${version}` : 'Consultando versión de la aplicación…'
        }
      />
    </div>
  )
}
