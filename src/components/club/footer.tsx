'use client'

import { Heart, MapPin, Phone, Mail } from 'lucide-react'
import { useT } from './i18n'
import { useSiteSettings } from './site-store'
import type { BranchSummary } from './types'

export function Footer({ branches }: { branches: BranchSummary[] }) {
  const t = useT()
  const contact = useSiteSettings((s) => s.settings?.contact)
  return (
    <footer className="mt-auto bg-(--club-dark) text-white/80 relative overflow-hidden">
      <div className="absolute inset-0 subtle-pattern opacity-40" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* النادي */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/images/logo.png"
                alt="شعار النادي الرياضي الرائد"
                className="h-12 w-12 rounded-full object-contain ring-2 ring-(--silver)/70"
              />
              <div>
                <div className="font-black text-white">{t('brand.name')}</div>
                <div className="text-(--silver) text-xs font-bold">{t('brand.sub')}</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{t('footer.desc')}</p>
          </div>

          {/* الفروع */}
          <div>
            <h3 className="font-black text-white mb-4 text-sm">{t('footer.branches')}</h3>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {branches.map((b) => (
                <li key={b.id}>
                  <a href="#branches" className="hover:text-(--silver) transition-colors">
                    {b.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* روابط سريعة */}
          <div>
            <h3 className="font-black text-white mb-4 text-sm">{t('footer.links')}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="hover:text-(--silver) transition-colors">{t('footer.linkAbout')}</a></li>
              <li><a href="#news" className="hover:text-(--silver) transition-colors">{t('footer.linkNews')}</a></li>
              <li><a href="#matches" className="hover:text-(--silver) transition-colors">{t('footer.linkMatches')}</a></li>
              <li><a href="#shop" className="hover:text-(--silver) transition-colors">{t('nav.shop')}</a></li>
              <li><a href="#join" className="hover:text-(--silver) transition-colors">{t('footer.linkJoin')}</a></li>
              <li><a href="#contact" className="hover:text-(--silver) transition-colors">{t('footer.linkContact')}</a></li>
            </ul>
          </div>

          {/* التواصل */}
          <div>
            <h3 className="font-black text-white mb-4 text-sm">{t('footer.contactInfo')}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-(--silver) mt-0.5 shrink-0" />
                <span>
                  {(contact?.addressLines?.length
                    ? contact.addressLines
                    : contact?.address
                      ? contact.address.split('\n').map((l) => l.trim()).filter(Boolean)
                      : ['حي الملعب، بلدية سعيدة، الجزائر']
                  ).map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </span>
              </li>
              {(contact?.phones?.length
                ? contact.phones
                : contact?.phone
                  ? [contact.phone]
                  : ['0770 12 34 56']
              ).map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-(--silver) shrink-0" />
                  <a href={`tel:${p.replace(/\s/g, '')}`} className="hover:text-(--silver) transition-colors" dir="ltr">
                    {p}
                  </a>
                </li>
              ))}
              {(contact?.emails?.length
                ? contact.emails
                : contact?.email
                  ? [contact.email]
                  : ['contact@raed-saida.dz']
              ).map((e) => (
                <li key={e} className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-(--silver) shrink-0" />
                  <a href={`mailto:${e}`} className="hover:text-(--silver) transition-colors break-all" dir="ltr">
                    {e}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <p>
            © {new Date().getFullYear()} {t('footer.rights')}
          </p>
          <p className="flex items-center gap-1.5">
            {t('footer.made')} <Heart className="h-4 w-4 text-(--silver) fill-(--silver)" /> {t('footer.madeTail')}
          </p>
        </div>
      </div>
    </footer>
  )
}
