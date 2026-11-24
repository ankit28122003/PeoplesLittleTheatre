import type { TheatreContent } from './content'

const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const backendConfigured = Boolean(supabaseUrl && supabaseAnonKey && import.meta.env.VITE_API_URL)

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${apiBase}${path}`, { ...init, signal: AbortSignal.timeout(75_000) })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('The server took too long to respond. Render may still be waking up; wait a moment and try again.')
    }
    throw new Error('The server could not be reached. Check the connection and try again.')
  }
  const result = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(result.error || `The server returned an error (${response.status}).`)
  return result
}

export function getContent() {
  return request<TheatreContent>('/api/content')
}

export function loginAdmin(email: string, password: string) {
  return request<{ token: string }>('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export function validateAdmin(token: string) {
  return request<{ ok: true }>('/api/admin/session', { headers: { Authorization: `Bearer ${token}` } })
}

export function logoutAdmin(token: string) {
  return request<{ ok: true }>('/api/admin/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
}

export function saveContent(content: TheatreContent, token: string) {
  return request<{ ok: true; updatedAt: string }>('/api/admin/content', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  })
}

export function uploadImage(file: File, token: string) {
  const body = new FormData()
  body.append('image', file)
  return request<{ url: string }>('/api/admin/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })
}
