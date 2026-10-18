'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Send, Loader2, Facebook, Instagram, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SettingsSectionHeader } from './shared'
import { useT } from './i18n'
import { useSiteSettings } from './site-store'
import { useToast } from '@/hooks/use-toast'

export function ContactSection() {
  const t = useT()
  const siteSettings = useSiteSettings((s) => s.settings)
  const { toast } = useToast()
  const [sending, setSending] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'خطأ غير متوقع')
      toast({ title: 'تم الإرسال', description: d.message })
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    } catch (err) {
      toast({ title: 'تعذر إرسال الرسالة', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const c = siteSettings?.contact

  // العنوان: أسطر متعددة من الإعدادات أو الافتراضي
  const addressLines = c?.addressLines?.length
    ? c.addressLines
    : c?.address
      ? c.address.split('\n').map((l) => l.trim()).filter(Boolean)
      : ['مقر النادي — حي الملعب', 'بلدية سعيدة، ولاية سعيدة، الجزائر']

  // الهواتف والبريد المتعددة من الإعدادات أو الافتراضي
  const phones = c?.phones?.length ? c.phones : c?.phone ? [c.phone] : ['0770 12 34 56', '0555 98 76 54']
  const emails = c?.emails?.length ? c.emails : c?.email ? [c.email] : ['contact@raed-saida.dz', 'info@raed-saida.dz']

  const socials = [
    { icon: Facebook, href: c?.facebook?.trim() || '', label: 'Facebook' },
    { icon: Instagram, href: c?.instagram?.trim() || '', label: 'Instagram' },
    { icon: Youtube, href: c?.youtube?.trim() || '', label: 'YouTube' },
  ].filter((s) => s.href)

  const infoCards = [
    {
      icon: MapPin,
      title: t('contact.infoAddress'),
      lines: addressLines,
    },
    {
      icon: Phone,
      title: t('contact.infoPhone'),
      lines: phones,
    },
    {
      icon: Mail,
      title: t('contact.infoEmail'),
      lines: emails,
    },
  ]

  return (
    <section id="contact" className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 subtle-pattern opacity-70" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SettingsSectionHeader
          light
          section="contact"
          eyebrowKey="contact.eyebrow"
          titleKey="contact.title"
          subtitleKey="contact.subtitle"
        />

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
          {/* معلومات التواصل */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="space-y-4"
          >
            {infoCards.map((card) => (
              <div key={card.title} className="flex gap-4 rounded-2xl border border-(--border) bg-(--chip) p-5">
                <div className="h-12 w-12 shrink-0 rounded-xl club-gradient flex items-center justify-center">
                  <card.icon className="h-6 w-6 text-(--silver) light:text-(--accent-deep2, var(--club))" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-(--ink) mb-1">{card.title}</h3>
                  {card.lines.map((l) =>
                    card.icon === Phone ? (
                      <a
                        key={l}
                        href={`tel:${l.replace(/\s/g, '')}`}
                        className="block text-sm text-muted-foreground hover:text-(--primary) font-bold transition-colors w-fit"
                        dir="ltr"
                      >
                        {l}
                      </a>
                    ) : card.icon === Mail ? (
                      <a
                        key={l}
                        href={`mailto:${l}`}
                        className="block text-sm text-muted-foreground hover:text-(--primary) font-bold transition-colors w-fit"
                        dir="ltr"
                      >
                        {l}
                      </a>
                    ) : (
                      <p key={l} className="text-sm text-muted-foreground">
                        {l}
                      </p>
                    )
                  )}
                </div>
              </div>
            ))}

            <div className="rounded-2xl club-gradient p-5 flex items-center justify-between">
              <span className="text-paper font-bold">{t('contact.follow')}</span>
              <div className="flex gap-2">
                {socials.length > 0 ? (
                  socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-xl bg-paper/10 hover:bg-(--silver) hover:text-(--club-dark) text-paper flex items-center justify-center transition-colors"
                      aria-label={s.label}
                    >
                      <s.icon className="h-5 w-5" />
                    </a>
                  ))
                ) : (
                  [Facebook, Instagram, Youtube].map((Icon, i) => (
                    <span
                      key={i}
                      className="h-10 w-10 rounded-xl bg-paper/10 text-paper/50 flex items-center justify-center"
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* النموذج */}
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            onSubmit={submit}
            className="rounded-3xl border border-(--border) bg-(--surface) shadow-sm p-6 md:p-8 space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="c-name">{t('contact.name')}</Label>
                <Input
                  id="c-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('contact.namePlaceholder')}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="c-phone">{t('contact.phone')}</Label>
                <Input
                  id="c-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="mt-1.5 text-right"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="c-email">{t('contact.email')}</Label>
              <Input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                dir="ltr"
                className="mt-1.5 text-right"
              />
            </div>
            <div>
              <Label htmlFor="c-message">{t('contact.message')}</Label>
              <Textarea
                id="c-message"
                required
                minLength={5}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('contact.messagePlaceholder')}
                className="mt-1.5"
              />
            </div>
            <Button
              type="submit"
              disabled={sending}
              className="w-full h-12 text-base font-black rounded-xl"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="ml-2 h-5 w-5" />}
              {sending ? t('contact.sending') : t('contact.send')}
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  )
}
