'use client'

import { useState } from 'react'
import { Loader2, LogIn, ShieldCheck, KeyRound, Info, Building2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useT } from './i18n'
import { saveSessionToken } from '@/lib/session'
import type { OfficeAccount, AdminAccount } from './types'

type LoginMode = 'office' | 'admin'

export function LoginModal({
  open,
  onClose,
  onSuccess,
  onSuccessAdmin,
}: {
  open: boolean
  onClose: () => void
  onSuccess: (account: OfficeAccount) => void
  onSuccessAdmin?: (admin: AdminAccount) => void
}) {
  const t = useT()
  const [mode, setMode] = useState<LoginMode>('office')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || t('login.invalid'))

      // حفظ التوكن محلياً ليشتغل الدخول حتى داخل iframe حيث تُحجب الكوكيز
      if (d.token) saveSessionToken(d.token)

      // تحديد الدور من الاستجابة (مع معالجة الصيغ القديمة والجديدة)
      const role: 'office' | 'admin' | undefined = d.role ?? (d.admin ? 'admin' : d.account ? 'office' : undefined)

      if (role === 'admin') {
        if (mode !== 'admin' || !onSuccessAdmin) throw new Error(t('login.errorAdminOnly'))
        onSuccessAdmin(d.admin as AdminAccount)
      } else if (role === 'office') {
        if (mode !== 'office') throw new Error(t('login.errorOfficeOnly'))
        onSuccess(d.account as OfficeAccount)
      } else {
        throw new Error(t('login.failed'))
      }
      setUsername('')
      setPassword('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="club-gradient px-6 py-7 text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-paper/10 ring-2 ring-(--silver)/60 flex items-center justify-center">
            {mode === 'admin' ? (
              <ShieldCheck className="h-7 w-7 text-(--silver) light:text-(--accent-deep2, var(--club))" />
            ) : (
              <KeyRound className="h-7 w-7 text-(--silver) light:text-(--accent-deep2, var(--club))" />
            )}
          </div>
          <DialogTitle className="text-xl font-black text-paper">
            {mode === 'admin' ? t('login.titleAdmin') : t('login.titleOffice')}
          </DialogTitle>
          <DialogDescription className="text-paper/70 mt-1 text-sm">
            {mode === 'admin' ? t('login.descAdmin') : t('login.descOffice')}
          </DialogDescription>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* مبدّل نوع الحساب */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-(--chip) p-1" role="tablist" aria-label="نوع الحساب">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'office'}
              onClick={() => {
                setMode('office')
                setError('')
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'office'
                  ? 'bg-white text-(--club-dark) shadow-sm'
                  : 'text-muted-foreground hover:text-(--ink)'
              }`}
            >
              <Building2 className="h-4 w-4" />
              {t('login.tabOffice')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'admin'}
              onClick={() => {
                setMode('admin')
                setError('')
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'admin'
                  ? 'bg-(--silver) text-(--club-dark) shadow-sm'
                  : 'text-muted-foreground hover:text-(--ink)'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {t('login.tabAdmin')}
            </button>
          </div>

          <div>
            <Label htmlFor="login-user">{t('login.username')}</Label>
            <Input
              id="login-user"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === 'admin' ? 'admin' : 'مثال: football'}
              dir="ltr"
              className="mt-1.5 text-right"
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="login-pass">{t('login.password')}</Label>
            <Input
              id="login-pass"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              dir="ltr"
              className="mt-1.5 text-right"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm font-bold text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-base font-black bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark) rounded-xl"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="ml-2 h-5 w-5" />}
            {loading ? t('login.checking') : t('login.submit')}
          </Button>

          <div className="rounded-xl bg-(--chip) p-3 text-xs text-muted-foreground leading-relaxed">
            {mode === 'admin' ? (
              <>
                <p className="flex items-start gap-1.5 font-bold text-(--ink)">
                  <Info className="h-4 w-4 text-(--primary) shrink-0 mt-0.5" />
                  {t('login.demoTitle')}
                </p>
                <p className="mt-1.5">
                  {t('login.demoAdminLine')}
                </p>
              </>
            ) : (
              <>
                <p className="flex items-start gap-1.5 font-bold text-(--ink)">
                  <Info className="h-4 w-4 text-(--primary) shrink-0 mt-0.5" />
                  {t('login.demoTitle')}
                </p>
                <p className="mt-1.5">
                  {t('login.demoOfficeUser')}:{' '}
                  <code className="font-bold text-(--primary)" dir="ltr">
                    football
                  </code>{' '}
                  — {t('login.demoOfficePass')}:{' '}
                  <code className="font-bold text-(--primary)" dir="ltr">
                    123456
                  </code>
                </p>
                <p>
                  {t('login.demoOtherOffices')}:{' '}
                  <code dir="ltr">basketball</code>، <code dir="ltr">handball</code>،{' '}
                  <code dir="ltr">swimming</code>...
                </p>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
