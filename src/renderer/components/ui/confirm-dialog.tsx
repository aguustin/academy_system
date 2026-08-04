import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './button'
import { Card } from './card'

// Reemplaza window.confirm()/window.alert(): en Electron esos diálogos nativos a veces dejan
// la ventana sin foco de teclado al cerrarse (los inputs/selects dejan de responder, aunque los
// clicks siguen funcionando). Al ser un modal propio, renderizado dentro de la misma ventana,
// el foco nunca sale del documento y el problema no puede ocurrir.

type ConfirmRequest = { message: string; resolve: (value: boolean) => void }
type AlertRequest = { message: string; resolve: () => void }

const ConfirmContext = createContext<((message: string) => Promise<boolean>) | null>(null)
const AlertContext = createContext<((message: string) => Promise<void>) | null>(null)

function Overlay({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onDismiss])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm space-y-4 p-6">{children}</Card>
    </div>,
    document.body
  )
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const [alertRequest, setAlertRequest] = useState<AlertRequest | null>(null)

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => setConfirmRequest({ message, resolve }))
  }, [])

  const alertDialog = useCallback((message: string) => {
    return new Promise<void>((resolve) => setAlertRequest({ message, resolve }))
  }, [])

  function resolveConfirm(result: boolean): void {
    confirmRequest?.resolve(result)
    setConfirmRequest(null)
  }

  function resolveAlert(): void {
    alertRequest?.resolve()
    setAlertRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      <AlertContext.Provider value={alertDialog}>
        {children}

        {confirmRequest && (
          <Overlay onDismiss={() => resolveConfirm(false)}>
            <p className="text-sm text-foreground">{confirmRequest.message}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => resolveConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => resolveConfirm(true)}>
                Confirmar
              </Button>
            </div>
          </Overlay>
        )}

        {alertRequest && (
          <Overlay onDismiss={resolveAlert}>
            <p className="text-sm text-foreground">{alertRequest.message}</p>
            <div className="flex justify-end">
              <Button size="sm" onClick={resolveAlert}>
                Aceptar
              </Button>
            </div>
          </Overlay>
        )}
      </AlertContext.Provider>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): (message: string) => Promise<boolean> {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm debe usarse dentro de ConfirmDialogProvider')
  return confirm
}

export function useAlertDialog(): (message: string) => Promise<void> {
  const alertDialog = useContext(AlertContext)
  if (!alertDialog) throw new Error('useAlertDialog debe usarse dentro de ConfirmDialogProvider')
  return alertDialog
}
