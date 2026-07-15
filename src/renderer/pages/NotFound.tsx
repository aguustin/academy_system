import { Link } from 'react-router-dom'

export function NotFound(): React.JSX.Element {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-2 bg-background text-foreground">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground">La página que buscás no existe.</p>
      <Link
        to="/"
        className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
