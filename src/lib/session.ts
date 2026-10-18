/**
 * إدارة الجلسة في المتصفح — توكن Bearer مخزّن في localStorage
 * يعمل داخل iframe والمعاينات حيث لا تُحفظ الكوكيز، مع بقاء الكوكي httpOnly احتياطاً
 */

const TOKEN_KEY = 'raed-session-token'

export function saveSessionToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // تجاهل بيئات localStorage المعطلة
  }
}

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // تجاهل
  }
}

/** fetch مع ترويسة Authorization تلقائياً للمسارات المحمية */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  const token = getSessionToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers, cache: 'no-store' })
}
