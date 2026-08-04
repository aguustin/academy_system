import { useState } from 'react'
import { useLocation } from 'react-router-dom'

// Al llegar desde la búsqueda global (Header), la navegación deja el término a precargar en
// location.state; cada pantalla de listado lo usa para inicializar su propio buscador local.
// Se ajusta durante el render (no en un efecto) siguiendo el patrón recomendado por React para
// "resetear estado cuando cambia una prop": https://react.dev/learn/you-might-not-need-an-effect
export function usePrefillSearch(): [string, (value: string) => void] {
  const location = useLocation()
  const [prevLocationState, setPrevLocationState] = useState(location.state)
  // El valor inicial ya debe leer el prefill: prevLocationState arranca en la misma referencia
  // que location.state, así que la comparación de abajo nunca dispara en el primer render.
  const [search, setSearch] = useState(
    () => (location.state as { prefillSearch?: string } | null)?.prefillSearch ?? ''
  )

  if (location.state !== prevLocationState) {
    setPrevLocationState(location.state)
    const prefill = (location.state as { prefillSearch?: string } | null)?.prefillSearch
    if (prefill) setSearch(prefill)
  }

  return [search, setSearch]
}
