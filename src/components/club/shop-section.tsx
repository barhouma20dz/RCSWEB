'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Loader2, Shirt, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SettingsSectionHeader } from './shared'
import { useT } from './i18n'
import { useToast } from '@/hooks/use-toast'
import type { ProductItem } from './types'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

/** هل المنتج من فئة الملابس (يظهر له اختيار المقاس)؟ */
function isClothing(category: string): boolean {
  return /ملابس|قميص|تيشيرت|سروال|جاكيت|قبعة|shirt|jersey|apparel|clothing|jacket|pant|cap/i.test(category)
}

function formatPrice(n: number): string {
  return n.toLocaleString('ar-DZ')
}

function OrderDialog({
  product,
  onClose,
}: {
  product: ProductItem | null
  onClose: () => void
}) {
  const t = useT()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [size, setSize] = useState('')
  const [note, setNote] = useState('')

  const close = () => {
    onClose()
    setTimeout(() => {
      setDone(false)
      setCustomerName('')
      setPhone('')
      setSize('')
      setNote('')
    }, 200)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    setSaving(true)
    try {
      const res = await fetch('/api/public/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName,
          phone,
          size: size || undefined,
          note: note || undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || t('shop.error'))
      toast({ title: t('shop.success') })
      setDone(true)
    } catch (err) {
      toast({ title: t('shop.error'), description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-md">
        {product && (
          <>
            <DialogHeader>
              <DialogTitle className="font-black text-(--ink) flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-(--primary)" />
                {t('shop.orderTitle')} — {product.name}
              </DialogTitle>
              <DialogDescription className="text-sm">
                <span className="font-black text-(--flag-red) text-lg">{formatPrice(product.price)}</span>{' '}
                {t('shop.priceUnit')}
              </DialogDescription>
            </DialogHeader>

            {done ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-3" />
                <p className="font-bold text-(--ink) leading-relaxed">{t('shop.success')}</p>
                <Button onClick={close} variant="outline" className="mt-4 font-bold">
                  {t('shop.order')}
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Label htmlFor="order-name">{t('shop.fullName')} *</Label>
                  <Input
                    id="order-name"
                    required
                    minLength={3}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t('shop.namePlaceholder')}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="order-phone">{t('shop.phone')} *</Label>
                  <Input
                    id="order-phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('shop.phonePlaceholder')}
                    dir="ltr"
                    className="mt-1.5 text-right"
                  />
                </div>
                {isClothing(product.category) && (
                  <div>
                    <Label>{t('shop.sizeOptional')}</Label>
                    <Select value={size} onValueChange={setSize} dir="rtl">
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder={t('shop.sizePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZES.map((s) => (
                          <SelectItem key={s} value={s} dir="ltr">
                            {s}
                          </SelectItem>
                        ))}
                        <SelectItem value="unique">{t('shop.uniqueSize')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="order-note">{t('shop.note')}</Label>
                  <Textarea
                    id="order-note"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('shop.notePlaceholder')}
                    className="mt-1.5"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 font-black bg-(--primary) hover:bg-(--primary)/90 text-primary-foreground rounded-xl"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingBag className="ml-2 h-5 w-5" />
                  )}
                  {saving ? t('shop.sending') : t('shop.confirm')}
                </Button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ShopSection({ products }: { products: ProductItem[] }) {
  const t = useT()
  const [selected, setSelected] = useState<ProductItem | null>(null)

  return (
    <section id="shop" className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 subtle-pattern opacity-60" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SettingsSectionHeader
          light
          section="shop"
          eyebrowKey="shop.eyebrow"
          titleKey="shop.title"
          subtitleKey="shop.subtitle"
        />

        {products.length === 0 ? (
          <div className="text-center py-14">
            <Shirt className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{t('shop.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
                className="card-hover rounded-2xl overflow-hidden bg-(--surface) border border-(--border) shadow-sm flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden bg-(--chip)">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full club-gradient flex items-center justify-center">
                      <Shirt className="h-14 w-14 text-paper/60" />
                    </div>
                  )}
                  {p.category && (
                    <span className="absolute top-3 right-3 bg-(--silver) text-(--club-dark) text-xs font-black px-3 py-1 rounded-full shadow">
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-black text-(--ink) text-lg">{p.name}</h3>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed flex-1">
                      {p.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-2xl font-black text-(--flag-red)" dir="ltr">
                      {formatPrice(p.price)}{' '}
                      <span className="text-sm">{t('shop.priceUnit')}</span>
                    </div>
                    <Button
                      onClick={() => setSelected(p)}
                      className="bg-(--primary) hover:bg-(--primary)/90 text-primary-foreground font-black rounded-xl"
                    >
                      <ShoppingBag className="ml-1.5 h-4 w-4" />
                      {t('shop.order')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <OrderDialog product={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
