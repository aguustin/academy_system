import { useEffect, useState } from 'react'

export function Dashboard(): React.JSX.Element {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    window.api.system.getVersion().then(setVersion)
  }, [])

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Bienvenido al Sistema Académico</h1>
      <p className="text-muted-foreground">
        {version ? `Versión de la aplicación: ${version}` : 'Consultando versión de la aplicación…'}
      </p>
    </div>
  )
}
