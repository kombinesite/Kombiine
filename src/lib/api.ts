const configured = (import.meta.env.VITE_MP_API_URL as string | undefined)?.trim().replace(/\/$/, '')
export const API_BASE = configured || ''
export const apiUrl = (path: string) => `${API_BASE}${path}`
let stateWriteQueue: Promise<boolean> = Promise.resolve(true)
export function persistStoreState(state: { products: unknown[]; orders: unknown[]; settings: unknown; seedVersion?: number }) {
  stateWriteQueue = stateWriteQueue.then(async () => {
    const response = await fetch(apiUrl('/api/store/state'), {
      method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    if (!response.ok) throw new Error(`Falha ao salvar no servidor (${response.status})`)
    return true
  }).catch((error) => { console.warn('[Kombine] sincronização com servidor não concluída:', error); return false })
  return stateWriteQueue
}
