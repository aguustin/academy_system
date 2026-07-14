import { Link } from 'react-router-dom'

export function NotFound(): React.JSX.Element {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-2 bg-background text-foreground">
      <h1 className="text-2xl font-semibold">404 — Página no encontrada</h1>
      <p className="text-muted-foreground">La página que buscás no existe.</p>
      <Link to="/" className="text-sm font-medium underline underline-offset-4">
        Volver al inicio
      </Link>
    </div>
  )
}
