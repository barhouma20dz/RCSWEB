'use client'

/**
 * مكتب النادي — الإصدار الإداري ونماذج المحررات الرسمية
 * المركز الإداري السيادي لإصدار كافة الأوراق، النماذج، المحاضر والمراسلات الرسمية للنادي
 * مع مولد إصدار سريع، قوالب مرجعية موحدة جزائرية، واستيراد وتخصيص النماذج
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  FileText,
  ScrollText,
  Mail,
  Inbox,
  Palette,
  Printer,
  Eye,
  EyeOff,
  Search,
  Stamp,
  Briefcase,
  Sparkles,
  Download,
  Upload,
  CheckCircle2,
  Copy,
  BookMarked,
  ArrowRight,
  Send,
  Building2,
  Calendar,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/session'
import { formatDateDMY } from '@/lib/date-format'
import { DocumentPaper, DOC_TYPE_LABELS, parseDesign, printClubDocument, type DocumentDesign } from '../document-paper'
import type { AdminData, ClubDocumentItem, ClubDocumentType } from '../types'

export interface ReferenceTemplate {
  id: string
  title: string
  type: ClubDocumentType
  category: string
  description: string
  content: string
  isCustom?: boolean
}

const TYPE_ICONS: Record<ClubDocumentType, React.ComponentType<{ className?: string }>> = {
  file: FileText,
  minute: ScrollText,
  letter: Mail,
  request: Inbox,
  design: Palette,
}

const TYPE_BADGE: Record<ClubDocumentType, string> = {
  file: 'bg-(--club)/10 text-(--club)',
  minute: 'bg-(--flag-red)/10 text-(--flag-red)',
  letter: 'bg-(--flag-green)/10 text-(--flag-green)',
  request: 'bg-amber-500/10 text-amber-700',
  design: 'bg-purple-500/10 text-purple-700',
}

const CATEGORIES = [
  'شهادات رسمية',
  'محاضر التنصيب والاجتماعات',
  'مراسلات إدارية',
  'تراخيص وملفات',
  'أوامر بمهمة',
  'طلبات وتخصيص',
  'ملفات الإطارات',
  'قرارات إدارية',
]

// النماذج المرجعية الرسمية الافتراضية للنوادي الرياضية الجزائرية
const DEFAULT_OFFICIAL_TEMPLATES: ReferenceTemplate[] = [
  {
    id: 'cert_membership',
    title: 'شهادة انتساب / تسجيل رياضي',
    type: 'file',
    category: 'شهادات رسمية',
    description: 'شهادة رسمية تثبت انتماء وانخراط الرياضي بالنادي لموسم معين مع رقم الرخصة.',
    content: `يشهد رئيس النادي الرياضي الرائد المتعدد الرياضات لبلدية سعيدة، أن الرياضي(ة): {{NAME}}،
المولود(ة) بتاريخ: {{BIRTH_DATE}} بـ: {{BIRTH_PLACE}}،
منخرط(ة) بصفة رسمية في صفوف النادي بفرع: {{BRANCH}}،
للموسم الرياضي: {{SEASON}}، تحت رقم رخصة: {{LICENSE_NO}}.

سُلمت له(ا) هذه الشهادة بطلب منه(ا) لاستعمالها في حدود ما يسمح به القانون والتشريع الرياضي المعمول به.`,
  },
  {
    id: 'convocation_official',
    title: 'استدعاء رسمي لاجتماع / جلسة عمل',
    type: 'letter',
    category: 'مراسلات إدارية',
    description: 'استدعاء مؤطر أو مسير أو رياضي لحضور اجتماع رسمي أو جلسة تنسيقية.',
    content: `إلى السيد(ة): {{NAME}}
الصفة: {{POSITION}} — فرع: {{BRANCH}}

الموضوع: استدعاء رسمي لحضور {{SUBJECT}}
المرجع: رقم {{REF}}

يُرجى منكم التفضل بالحضور إلى مقر إدارة النادي يوم {{DATE}} على الساعة {{TIME}}،
وذلك لحضور {{SUBJECT}} ومناقشة النقاط التالية:
1. تقييم النشاط والجاهزية الرياضية للموسم {{SEASON}}.
2. مناقشة الملفات الإدارية والانضباطية الخاصة بالفرع.
3. توجيهات الإدارة العامة والتحضيرات للمنافسات القادمة.

نظراً لأهمية الاجتماع، فإن حضوركم الشخصي إلزامي ومؤكد في الموعد المحدد أعلاه.`,
  },
  {
    id: 'pv_installation',
    title: 'محضر تنصيب إطار أو مسؤول فرع',
    type: 'minute',
    category: 'محاضر التنصيب والاجتماعات',
    description: 'محضر قانوني يثبت تنصيب مسير أو مدرب أو مسؤول فرع رياضي بصفة رسمية.',
    content: `في يوم {{DATE}}، وبمقر النادي الرياضي الرائد بسعيدة،
اجتمع المكتب التنفيذي برئاسة رئيس النادي، وبحضور المعنيين،
حيث تم رسمياً تنصيب السيد(ة): {{NAME}} المولود(ة) بتاريخ: {{BIRTH_DATE}}،
في منصب: {{POSITION}} بفرع: {{BRANCH}} للموسم الرياضي: {{SEASON}}.

بموجب هذا المحضر، يُفوَّض للمعني الصلاحيات الكاملة لممارسة مهامه الإدارية والفنية المنصوص عليها في القانون الأساسي للنادي، ويلتزم بالسهر على الانضباط، حماية ممتلكات النادي، والتطبيق الصارم للتوجيهات العامة.

حُرر هذا المحضر لإثبات التنصيب والعمل به قانوناً.`,
  },
  {
    id: 'parental_authorization',
    title: 'ترخيص أبوي لانخراط رياضي قاصر',
    type: 'request',
    category: 'تراخيص وملفات',
    description: 'وثيقة ترخيص وموافقة ولي الأمر على ممارسة النشاط الرياضي ومرافقة الوفد.',
    content: `أنا الموقع أسفله السيد(ة): {{GUARDIAN_NAME}}،
الحامل(ة) لبطاقة التعريف الوطنية رقم: {{ID_CARD}} الصادرة بتاريخ: {{ID_DATE}} عن دائرة: {{ID_PLACE}}،
بصفتي الولي الشرعي للقاصر: {{NAME}}، المولود(ة) بتاريخ: {{BIRTH_DATE}} بـ: {{BIRTH_PLACE}}،

أصرح بشرفي أنني أرخص لابني(ابنتي) بالانخراط في صفوف النادي الرياضي الرائد بفرع: {{BRANCH}} للموسم الرياضي: {{SEASON}}،
والمشاركة في جميع الحصص التدريبية، التربصات والمباريات والبطولات الرسمية والودية داخل وخارج الولاية،
وأتحمل كامل المسؤولية المترتبة عن هذا الترخيص وفق القوانين الرياضية السارية.`,
  },
  {
    id: 'good_conduct',
    title: 'شهادة حسن السيرة والسلوك الرياضي',
    type: 'file',
    category: 'شهادات رسمية',
    description: 'شهادة تقديرية وتزكية أخلاقية تثبت انضباط الرياضي أو الإطار داخل النادي.',
    content: `يشهد رئيس النادي الرياضي الرائد متعدد الرياضات لبلدية سعيدة،
أن الرياضي(ة) / المؤطر: {{NAME}}،
المنتمي لفرع: {{BRANCH}} تحت رقم رخصة: {{LICENSE_NO}}،
يتحلى بالأخلاق الرياضية العالية وحسن السيرة والسلوك والانضباط التام للوائح النادي والروح الرياضية طيلة فترة نشاطه بالنادي، ولم تُسجل ضده أي عقوبة انضباطية طيلة الموسم {{SEASON}}.

سُلمت له هذه الشهادة اعترافاً بانضباطه ومثاليته الرياضية، وللإدلاء بها فيما يسمح به القانون.`,
  },
  {
    id: 'djs_correspondence',
    title: 'مراسلة رسمية إلى مديرية الشباب والرياضة / الرابطة',
    type: 'letter',
    category: 'مراسلات إدارية',
    description: 'رسالة إدارية رسمية موجهة لمديرية الشباب والرياضة أو الرابطات الولائية والجهوية.',
    content: `إلى السيد: مدير الشباب والرياضة لولاية سعيدة / السيد رئيس الرابطة الولائية
الموضوع: {{SUBJECT}}
المرجع: رقم {{REF}}

يشرفنا نحن إدارة النادي الرياضي الرائد متعدد الرياضات لبلدية سعيدة، أن نرفع إلى كريم علمكم ما يلي:
{{BODY_TEXT}}

شاكرين لكم مسبقاً حسن تعاونكم الدائم في ترقية الرياضة ودعم نوادي الولاية،
وتفضلوا سيدي بقبول أسمى عبارات التقدير والاحترام الرياضي.`,
  },
  {
    id: 'mission_order',
    title: 'أمر بمهمة وتنقل وفد النادي',
    type: 'design',
    category: 'أوامر بمهمة',
    description: 'وثيقة تنقل رسمية لتمثيل النادي وتسهيل مهام الوفد الرياضي أمام السلطات.',
    content: `بمقتضى الصلاحيات المخولة لإدارة النادي،
يُكلف السيد(ة): {{NAME}} (الصفة: {{POSITION}})،
رفقة وفد فرع: {{BRANCH}} والمقدر عددهم بـ {{COUNT}} فرداً،
بالتنقل إلى مدينة: {{DESTINATION}} في الفترة الممتدة من {{START_DATE}} إلى {{END_DATE}}،
وذلك لتمثيل النادي والمشاركة في: {{EVENT_NAME}}.

تُرجى من كافة السلطات المدنية والأمنية والرياضية تقديم يد المساعدة والتسهيلات اللازمة للسيد(ة) المذكور ووفد النادي المرافق لإتمام هذه المهمة في أحسن الظروف.`,
  },
  {
    id: 'facility_reservation',
    title: 'طلب تخصيص منشأة رياضية (قاعة / مسبح / ملعب)',
    type: 'request',
    category: 'طلبات وتخصيص',
    description: 'طلب رسمي موجه لمدراء المنشآت لحجز وتخصيص حصص تدريبية أو مباريات.',
    content: `إلى السيد: مدير القاعة متعددة الرياضات / مسبح ولاية سعيدة
الموضوع: طلب تخصيص حصص تدريبية لفرع {{BRANCH}}
الموسم الرياضي: {{SEASON}}

نلتمس من سيادتكم التكرم بالموافقة على تخصيص أوقات تدريبية لفائدة رياضيي فرع: {{BRANCH}} بالنادي الرياضي الرائد، وذلك تحضيراً للاستحقاقات والبطولات الوطنية والجهوية المقبلة.

الأوقات المقترحة للتدريبات:
— الأيام: {{DAYS}}
— التوقيت: من الساعة {{START_TIME}} إلى الساعة {{END_TIME}}

تقبلوا منا فائق التقدير والاحترام والشكر الجزيل على دعمكم المستمر لنادينا.`,
  },
]

const DEFAULT_DESIGN: DocumentDesign = {
  style: 'official',
  accent: 'navy',
  showLogo: true,
  showStamp: true,
  showWatermark: true,
  signatureName: 'رئيس النادي',
}

const TEMPLATES_STORAGE_KEY = 'rcs_custom_club_templates_v1'

export function RecordsManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const [activeOfficeTab, setActiveOfficeTab] = useState<'quick' | 'archive' | 'templates'>('quick')

  // أرشيف الوثائق والفلترة
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ClubDocumentItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [viewDoc, setViewDoc] = useState<ClubDocumentItem | null>(null)
  const [formTab, setFormTab] = useState<'data' | 'design'>('data')

  // النماذج المرجعية وقوالب الاستيراد
  const [customTemplates, setCustomTemplates] = useState<ReferenceTemplate[]>([])
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [newTemplateForm, setNewTemplateForm] = useState({
    title: '',
    type: 'file' as ClubDocumentType,
    category: 'شهادات رسمية',
    description: '',
    content: '',
  })

  // مولد الإصدار السريع للوثيقة
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('cert_membership')
  const [quickForm, setQuickForm] = useState({
    refNumber: '',
    branchId: '',
    memberId: '',
    name: '',
    birthDate: '',
    birthPlace: '',
    position: 'رياضي',
    licenseNo: '',
    season: '2026/2027',
    date: new Date().toISOString().slice(0, 10),
    time: '17:00',
    subject: 'شهادة انتساب للموسم الحالي',
    guardianName: '',
    idCard: '',
    idDate: '',
    idPlace: '',
    destination: 'سعيدة',
    count: '15',
    startDate: '',
    endDate: '',
    eventName: 'البطولة الولائية',
    days: 'السبت، الإثنين، الأربعاء',
    startTime: '17:00',
    endTime: '19:00',
    bodyText: 'نحيطكم علماً بأن النادي قد أتم جميع الإجراءات القانونية والإدارية اللازمة للمشاركة في المنافسة.',
    visibleToBranch: true,
  })

  // نموذج الوثيقة العادي (أرشيف/تعديل)
  const [form, setForm] = useState({
    refNumber: '',
    title: '',
    type: 'file' as ClubDocumentType,
    category: '',
    content: '',
    branchId: '',
    memberId: '',
    visibleToBranch: false,
    design: '',
  })
  const [design, setDesign] = useState<DocumentDesign>({ ...DEFAULT_DESIGN })

  const documents = data.documents ?? []
  const members = data.members ?? []
  const branches = data.branches ?? []

  // تحميل النماذج المخصصة المحفوظة
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ReferenceTemplate[]
        if (Array.isArray(parsed)) setCustomTemplates(parsed)
      }
    } catch {
      // تجاهل أخطاء التخزين
    }
  }, [])

  // دمج النماذج الرسمية مع المستوردة
  const allTemplates = useMemo(() => {
    return [...DEFAULT_OFFICIAL_TEMPLATES, ...customTemplates]
  }, [customTemplates])

  const selectedTemplate = useMemo(() => {
    return allTemplates.find((t) => t.id === selectedTemplateId) || allTemplates[0]
  }, [allTemplates, selectedTemplateId])

  // الترقيم التلقائي للمرجع
  const nextRef = useMemo(() => {
    const year = new Date().getFullYear()
    return `CRS/${year}/${String(documents.length + 1).padStart(3, '0')}`
  }, [documents.length])

  // ضبط المرجع الافتراضي عند فتح الإصدار السريع
  useEffect(() => {
    if (!quickForm.refNumber) {
      setQuickForm((prev) => ({ ...prev, refNumber: nextRef }))
    }
  }, [nextRef, quickForm.refNumber])

  // توليد النص النهائي مع استبدال المتغيرات للنموذج المختار
  const generatedContent = useMemo(() => {
    if (!selectedTemplate) return ''
    const currentBranch = branches.find((b) => b.id === quickForm.branchId)?.name || 'النادي العام'
    let text = selectedTemplate.content
    text = text.replace(/{{NAME}}/g, quickForm.name || 'علاء الدين بوعناني')
    text = text.replace(/{{BIRTH_DATE}}/g, quickForm.birthDate || '2004/05/12')
    text = text.replace(/{{BIRTH_PLACE}}/g, quickForm.birthPlace || 'سعيدة')
    text = text.replace(/{{BRANCH}}/g, currentBranch)
    text = text.replace(/{{SEASON}}/g, quickForm.season || '2026/2027')
    text = text.replace(/{{LICENSE_NO}}/g, quickForm.licenseNo || 'ALG-26-8841')
    text = text.replace(/{{POSITION}}/g, quickForm.position || 'رياضي')
    text = text.replace(/{{DATE}}/g, quickForm.date || formatDateDMY(new Date()))
    text = text.replace(/{{TIME}}/g, quickForm.time || '17:00')
    text = text.replace(/{{SUBJECT}}/g, quickForm.subject || selectedTemplate.title)
    text = text.replace(/{{REF}}/g, quickForm.refNumber || nextRef)
    text = text.replace(/{{GUARDIAN_NAME}}/g, quickForm.guardianName || 'بوعناني عبد القادر')
    text = text.replace(/{{ID_CARD}}/g, quickForm.idCard || '1148729502')
    text = text.replace(/{{ID_DATE}}/g, quickForm.idDate || '2020/03/15')
    text = text.replace(/{{ID_PLACE}}/g, quickForm.idPlace || 'دائرة سعيدة')
    text = text.replace(/{{DESTINATION}}/g, quickForm.destination || 'وهران')
    text = text.replace(/{{COUNT}}/g, quickForm.count || '18')
    text = text.replace(/{{START_DATE}}/g, quickForm.startDate || '2026/11/01')
    text = text.replace(/{{END_DATE}}/g, quickForm.endDate || '2026/11/05')
    text = text.replace(/{{EVENT_NAME}}/g, quickForm.eventName || 'البطولة الوطنية للنوادي')
    text = text.replace(/{{DAYS}}/g, quickForm.days || 'السبت، الإثنين، الأربعاء')
    text = text.replace(/{{START_TIME}}/g, quickForm.startTime || '17:00')
    text = text.replace(/{{END_TIME}}/g, quickForm.endTime || '19:00')
    text = text.replace(/{{BODY_TEXT}}/g, quickForm.bodyText || '')
    return text
  }, [selectedTemplate, quickForm, branches, nextRef])

  // تجهيز كائن الوثيقة الحية للمعاينة
  const quickPreviewDoc = useMemo(() => {
    const selBranch = branches.find((b) => b.id === quickForm.branchId)
    const selMember = members.find((m) => m.id === quickForm.memberId)
    return {
      refNumber: quickForm.refNumber || nextRef,
      title: `${selectedTemplate?.title ?? 'محرر إداري'} — ${quickForm.name || 'المعني'}`,
      type: selectedTemplate?.type || 'file',
      category: selectedTemplate?.category || 'شهادات رسمية',
      content: generatedContent,
      design: JSON.stringify(DEFAULT_DESIGN),
      createdAt: quickForm.date || new Date().toISOString(),
      member: selMember
        ? { id: selMember.id, firstName: selMember.firstName, lastName: selMember.lastName, position: selMember.position }
        : null,
      branch: selBranch ? { name: selBranch.name, slug: selBranch.slug, color: selBranch.color } : null,
    }
  }, [quickForm, nextRef, selectedTemplate, generatedContent, branches, members])

  // حفظ وإصدار الوثيقة من المولد السريع
  const issueQuickDocument = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            refNumber: quickPreviewDoc.refNumber,
            title: quickPreviewDoc.title,
            type: quickPreviewDoc.type,
            category: quickPreviewDoc.category,
            content: generatedContent,
            branchId: quickForm.branchId || null,
            memberId: quickForm.memberId || null,
            visibleToBranch: quickForm.visibleToBranch,
            design: JSON.stringify(DEFAULT_DESIGN),
          },
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل إصدار الوثيقة')
      toast({
        title: 'تم إصدار الوثيقة بنجاح في مكتب النادي!',
        description: quickForm.visibleToBranch ? 'تم إرسالها وعرضها أيضاً في مكتب الفرع المعني.' : 'حُفظت في الأرشيف المركزي.',
      })
      reload()
      // تحديث رقم المرجع للعملية التالية
      setQuickForm((prev) => ({
        ...prev,
        refNumber: `CRS/${new Date().getFullYear()}/${String(documents.length + 2).padStart(3, '0')}`,
      }))
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الإصدار', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // إضافة واستيراد نموذج مرجعي جديد
  const saveCustomTemplate = () => {
    if (!newTemplateForm.title.trim() || !newTemplateForm.content.trim()) {
      toast({ title: 'يرجى كتابة عنوان النموذج ونصه', variant: 'destructive' })
      return
    }

    const newTpl: ReferenceTemplate = {
      id: `custom_${Date.now()}`,
      title: newTemplateForm.title.trim(),
      type: newTemplateForm.type,
      category: newTemplateForm.category,
      description: newTemplateForm.description.trim() || 'نموذج إداري مخصص تم استيراده لمكتب النادي.',
      content: newTemplateForm.content.trim(),
      isCustom: true,
    }

    const updated = [newTpl, ...customTemplates]
    setCustomTemplates(updated)
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }

    toast({ title: `تمت إضافة النموذج المرجعي «${newTpl.title}» بنجاح!` })
    setSelectedTemplateId(newTpl.id)
    setImportModalOpen(false)
    setNewTemplateForm({
      title: '',
      type: 'file',
      category: 'شهادات رسمية',
      description: '',
      content: '',
    })
    setActiveOfficeTab('quick')
  }

  // حذف نموذج مرجعي مخصص
  const deleteCustomTemplate = (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف النموذج المرجعي «${name}»؟`)) return
    const updated = customTemplates.filter((t) => t.id !== id)
    setCustomTemplates(updated)
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
    toast({ title: 'تم حذف النموذج' })
    if (selectedTemplateId === id) {
      setSelectedTemplateId('cert_membership')
    }
  }

  // استيراد من ملف نصي
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        setNewTemplateForm((prev) => ({
          ...prev,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
          content: text,
        }))
        toast({ title: 'تم استيراد نص النموذج من الملف بنجاح' })
      }
    }
    reader.readAsText(file)
  }

  // فلترة قائمة الأرشيف
  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (branchFilter === 'general' && d.branchId) return false
      if (branchFilter !== 'all' && branchFilter !== 'general' && d.branchId !== branchFilter) return false
      if (query) {
        const q = query.trim()
        if (
          !d.title.includes(q) &&
          !(d.refNumber || '').toLowerCase().includes(q.toLowerCase()) &&
          !d.category.includes(q)
        )
          return false
      }
      return true
    })
  }, [documents, typeFilter, branchFilter, query])

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: documents.length }
    for (const d of documents) c[d.type] = (c[d.type] ?? 0) + 1
    return c
  }, [documents])

  const availableMembers = useMemo(() => {
    if (quickForm.branchId) return members.filter((m) => m.branchId === quickForm.branchId)
    return members
  }, [members, quickForm.branchId])

  const openCreate = () => {
    setEditing(null)
    setForm({
      refNumber: nextRef,
      title: '',
      type: 'file',
      category: '',
      content: '',
      branchId: '',
      memberId: '',
      visibleToBranch: false,
      design: '',
    })
    setDesign({ ...DEFAULT_DESIGN })
    setFormTab('data')
    setOpen(true)
  }

  const openEdit = (doc: ClubDocumentItem) => {
    setEditing(doc)
    setForm({
      refNumber: doc.refNumber,
      title: doc.title,
      type: doc.type,
      category: doc.category,
      content: doc.content,
      branchId: doc.branchId ?? '',
      memberId: doc.memberId ?? '',
      visibleToBranch: doc.visibleToBranch,
      design: doc.design,
    })
    setDesign(parseDesign(doc.design))
    setFormTab('data')
    setOpen(true)
  }

  const saveEditedDoc = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editing ? 'update' : 'create',
          id: editing?.id,
          data: {
            refNumber: form.refNumber,
            title: form.title,
            type: form.type,
            category: form.category,
            content: form.content,
            branchId: form.branchId || null,
            memberId: form.memberId || null,
            visibleToBranch: form.visibleToBranch,
            design: JSON.stringify(design),
          },
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل الحفظ')
      toast({ title: editing ? 'تم تحديث الوثيقة في مكتب النادي' : 'تم تسجيل الوثيقة في مكتب النادي' })
      setOpen(false)
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحفظ', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const toggleVisible = async (doc: ClubDocumentItem) => {
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: doc.visibleToBranch ? 'hide' : 'show',
          id: doc.id,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل تنفيذ الأمر')
      toast({
        title: doc.visibleToBranch
          ? `تم إخفاء «${doc.title}» من حساب الفرع`
          : `تم ${doc.branchId ? 'إرسال' : 'عرض'} «${doc.title}» في حساب الفرع`,
      })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل التنفيذ', variant: 'destructive' })
    }
  }

  const removeDoc = async (doc: ClubDocumentItem) => {
    if (!window.confirm(`حذف «${doc.title}» نهائياً من مكتب النادي؟`)) return
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: doc.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل الحذف')
      toast({ title: 'تم حذف الوثيقة' })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحذف', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* الرأس الرئيسي لمكتب النادي */}
      <div className="rounded-3xl club-gradient p-6 md:p-8 relative overflow-hidden text-white shadow-xl">
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-(--silver)/10 blur-2xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <Briefcase className="h-8 w-8 text-(--silver)" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl md:text-3xl font-black">مكتب النادي — الإصدار الإداري ونماذج المحررات</h2>
                <Badge className="bg-(--silver) text-(--club-dark) font-black text-xs">الصفحة الإدارية الأولى</Badge>
              </div>
              <p className="text-white/80 text-sm mt-1 max-w-3xl leading-relaxed">
                المركز الإداري السيادي لإصدار كافة الأوراق، النماذج، المحاضر والمراسلات الرسمية للنادي — مع ميزة الإصدار السريع، القوالب المرجعية الموحدة، واستيراد النماذج وتخصيصها.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setImportModalOpen(true)}
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 font-bold backdrop-blur-sm"
            >
              <Upload className="ml-1.5 h-4 w-4" />
              استيراد نموذج مرجعي
            </Button>
          </div>
        </div>

        {/* التبويبات الثلاثة الرئيسية */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-4">
          <button
            onClick={() => setActiveOfficeTab('quick')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
              activeOfficeTab === 'quick'
                ? 'bg-white text-(--club-dark) shadow-lg scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            إصدار وثيقة سريعة (المولد الذكي)
          </button>
          <button
            onClick={() => setActiveOfficeTab('archive')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
              activeOfficeTab === 'archive'
                ? 'bg-white text-(--club-dark) shadow-lg scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <BookMarked className="h-4 w-4 text-blue-500" />
            أرشيف المحررات والوثائق الصادرة ({documents.length})
          </button>
          <button
            onClick={() => setActiveOfficeTab('templates')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
              activeOfficeTab === 'templates'
                ? 'bg-white text-(--club-dark) shadow-lg scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Copy className="h-4 w-4 text-emerald-500" />
            مكتبة النماذج والمراجع ({allTemplates.length})
          </button>
        </div>
      </div>

      {/* 1. تبويب الإصدار السريع */}
      {activeOfficeTab === 'quick' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* العمود الأيمن: اختيار النموذج وتعبئة المتغيرات */}
          <div className="lg:col-span-6 space-y-5">
            {/* اختيار النموذج */}
            <div className="rounded-2xl bg-white border border-(--border) p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-(--club-dark) flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    اختر النموذج المطلوب إصداره
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    الترويسة الرسمية الموحدة تُطبق تلقائياً — فقط عدّل بيانات المعني والتاريخ.
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {quickForm.refNumber || nextRef}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto nice-scroll pr-1">
                {allTemplates.map((tpl) => {
                  const isSel = selectedTemplateId === tpl.id
                  const Icon = TYPE_ICONS[tpl.type] || FileText
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`text-right p-3 rounded-xl border transition-all text-xs flex flex-col justify-between gap-1.5 ${
                        isSel
                          ? 'border-(--club) bg-(--club)/5 shadow-sm ring-1 ring-(--club)'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-(--club-dark)">
                        <Icon className="h-3.5 w-3.5 text-(--club) shrink-0" />
                        <span className="truncate">{tpl.title}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{tpl.category}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* حقول المتغيرات المخصصة للنموذج المختار */}
            <div className="rounded-2xl bg-white border border-(--border) p-5 shadow-sm space-y-4">
              <div className="border-b pb-3">
                <h4 className="text-sm font-black text-(--club-dark) flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  بيانات الشخص المعني والمحرر
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تتغير وتُطبع داخل النموذج فوراً مع الحفاظ على الترويسة والختم.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* الاسم واللقب */}
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-bold">الاسم واللقب للشخص المعني *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={quickForm.name}
                      onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                      placeholder="مثال: علاء الدين بوعناني"
                      className="font-bold"
                    />
                    {/* اختيار سريع من إطارات النادي */}
                    <Select
                      value={quickForm.memberId || '__none'}
                      onValueChange={(v) => {
                        if (v === '__none') {
                          setQuickForm({ ...quickForm, memberId: '' })
                        } else {
                          const m = members.find((x) => x.id === v)
                          if (m) {
                            setQuickForm({
                              ...quickForm,
                              memberId: m.id,
                              name: `${m.firstName} ${m.lastName}`,
                              position: m.position || quickForm.position,
                              branchId: m.branchId || quickForm.branchId,
                            })
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-36 shrink-0 text-xs">
                        <SelectValue placeholder="إطار مسجل..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">اختيار يدوي</SelectItem>
                        {availableMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.firstName} {m.lastName} ({m.position})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* الفرع الرياضي */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold">الفرع الرياضي المعني</Label>
                  <Select
                    value={quickForm.branchId || '__general'}
                    onValueChange={(v) => setQuickForm({ ...quickForm, branchId: v === '__general' ? '' : v })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="كل الفروع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__general">الإدارة العامة (عام لكافة الفروع)</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* تاريخ الوثيقة */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold">تاريخ التحرير / الإصدار</Label>
                  <Input
                    type="date"
                    value={quickForm.date}
                    onChange={(e) => setQuickForm({ ...quickForm, date: e.target.value })}
                    className="text-xs"
                  />
                </div>

                {/* تاريخ ومكان الميلاد */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold">تاريخ الميلاد</Label>
                  <Input
                    value={quickForm.birthDate}
                    onChange={(e) => setQuickForm({ ...quickForm, birthDate: e.target.value })}
                    placeholder="مثال: 2004/05/12"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">مكان الميلاد</Label>
                  <Input
                    value={quickForm.birthPlace}
                    onChange={(e) => setQuickForm({ ...quickForm, birthPlace: e.target.value })}
                    placeholder="سعيدة"
                    className="text-xs"
                  />
                </div>

                {/* الصفة ورقم الرخصة */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold">الصفة / المنصب</Label>
                  <Input
                    value={quickForm.position}
                    onChange={(e) => setQuickForm({ ...quickForm, position: e.target.value })}
                    placeholder="رياضي، مدرب، كاتب عام..."
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">رقم الرخصة / القيد</Label>
                  <Input
                    value={quickForm.licenseNo}
                    onChange={(e) => setQuickForm({ ...quickForm, licenseNo: e.target.value })}
                    placeholder="ALG-26-8841"
                    className="text-xs font-mono"
                    dir="ltr"
                  />
                </div>

                {/* حقول إضافية ذكية بحسب النموذج */}
                {selectedTemplate?.id === 'parental_authorization' && (
                  <>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-bold">اسم الولي الشرعي</Label>
                      <Input
                        value={quickForm.guardianName}
                        onChange={(e) => setQuickForm({ ...quickForm, guardianName: e.target.value })}
                        placeholder="اسم ولقب الولي"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">رقم بطاقة التعريف الوطنية</Label>
                      <Input
                        value={quickForm.idCard}
                        onChange={(e) => setQuickForm({ ...quickForm, idCard: e.target.value })}
                        placeholder="1148729502"
                        className="text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">صادرة بتاريخ وعن دائرة</Label>
                      <Input
                        value={quickForm.idPlace}
                        onChange={(e) => setQuickForm({ ...quickForm, idPlace: e.target.value })}
                        placeholder="دائرة سعيدة"
                        className="text-xs"
                      />
                    </div>
                  </>
                )}

                {selectedTemplate?.id === 'mission_order' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">مدينة الوجهة / التنقل</Label>
                      <Input
                        value={quickForm.destination}
                        onChange={(e) => setQuickForm({ ...quickForm, destination: e.target.value })}
                        placeholder="وهران"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">عدد أفراد الوفد</Label>
                      <Input
                        value={quickForm.count}
                        onChange={(e) => setQuickForm({ ...quickForm, count: e.target.value })}
                        placeholder="18"
                        className="text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {selectedTemplate?.id === 'djs_correspondence' && (
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-bold">محتوى المراسلة</Label>
                    <Textarea
                      value={quickForm.bodyText}
                      onChange={(e) => setQuickForm({ ...quickForm, bodyText: e.target.value })}
                      rows={4}
                      className="text-xs"
                      placeholder="اكتب تفاصيل المراسلة الرسمية..."
                    />
                  </div>
                )}
              </div>

              {/* خيار إظهار في حساب الفرع */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3 mt-2">
                <div>
                  <div className="font-bold text-xs text-(--club-dark)">إرسال مباشر إلى مكتب الفرع</div>
                  <div className="text-[11px] text-muted-foreground">
                    تظهر الوثيقة فوراً لمسؤولي الفرع بحسابهم للتحميل والطباعة.
                  </div>
                </div>
                <Switch
                  checked={quickForm.visibleToBranch}
                  onCheckedChange={(v) => setQuickForm({ ...quickForm, visibleToBranch: v })}
                />
              </div>

              {/* أزرار الإجراءات */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <Button
                  onClick={issueQuickDocument}
                  disabled={saving}
                  className="bg-(--club) hover:bg-(--club)/90 text-white font-black flex-1 shadow-md"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1.5" /> : <SaveIcon className="h-4 w-4 ml-1.5" />}
                  حفظ وإصدار في الأرشيف
                </Button>
                <Button
                  variant="outline"
                  onClick={() => printClubDocument('quick-issue-doc-paper')}
                  className="border-slate-300 font-bold hover:bg-slate-100"
                >
                  <Printer className="h-4 w-4 ml-1.5" />
                  طباعة الورقة A4
                </Button>
              </div>
            </div>
          </div>

          {/* العمود الأيسر: المعاينة الحية للورقة الرسمية A4 */}
          <div className="lg:col-span-6 space-y-3 sticky top-24">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-(--club) text-white font-bold text-xs">معاينة حية جاهزة للطباعة A4</Badge>
                <span className="text-xs text-muted-foreground font-mono">الترويسة والختم موحدان</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => printClubDocument('quick-issue-doc-paper')} className="text-xs font-bold">
                <Printer className="h-3.5 w-3.5 ml-1" />
                طباعة سريعة
              </Button>
            </div>

            <div className="rounded-2xl bg-slate-200/60 p-4 border border-(--border) shadow-inner overflow-hidden max-h-[85vh] overflow-y-auto nice-scroll">
              <DocumentPaper id="quick-issue-doc-paper" doc={quickPreviewDoc} />
            </div>
          </div>
        </div>
      )}

      {/* 2. تبويب أرشيف المحررات والوثائق الصادرة */}
      {activeOfficeTab === 'archive' && (
        <div className="space-y-4">
          {/* أدوات البحث والفلترة */}
          <div className="rounded-2xl bg-white border border-(--border) p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بعنوان الوثيقة، رقم المرجع، أو التصنيف..."
                className="pr-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 text-xs">
                  <SelectValue placeholder="كل الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع ({typeCounts.all})</SelectItem>
                  {(Object.keys(DOC_TYPE_LABELS) as ClubDocumentType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {DOC_TYPE_LABELS[t]} ({typeCounts[t] ?? 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-44 text-xs">
                  <SelectValue placeholder="كل الفروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفروع</SelectItem>
                  <SelectItem value="general">الإدارة العامة فقط</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={openCreate} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold shrink-0">
                <Plus className="ml-1 h-4 w-4" />
                وثيقة يدوية جديدة
              </Button>
            </div>
          </div>

          {/* قائمة الوثائق */}
          <div className="rounded-2xl bg-white border border-(--border) overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-3">
                <Briefcase className="h-12 w-12 mx-auto opacity-30 text-(--club)" />
                <p className="font-bold text-base">لا توجد وثائق مطابقة في أرشيف مكتب النادي</p>
                <Button onClick={() => setActiveOfficeTab('quick')} variant="outline" className="text-xs font-bold">
                  <Sparkles className="h-4 w-4 ml-1.5 text-amber-500" />
                  إصدار وثيقة جديدة الآن
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-(--border)">
                {filtered.map((doc) => {
                  const Icon = TYPE_ICONS[doc.type] || FileText
                  return (
                    <li
                      key={doc.id}
                      className="p-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="h-12 w-12 rounded-xl bg-(--club-light) flex items-center justify-center shrink-0 border border-(--border)">
                        <Icon className="h-6 w-6 text-(--club)" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-(--club-dark) text-sm">{doc.title}</span>
                          <Badge variant="outline" className="text-[10px] font-mono" dir="ltr">
                            {doc.refNumber || 'بلا رقم'}
                          </Badge>
                          <Badge className={`text-[10px] ${TYPE_BADGE[doc.type]}`}>{DOC_TYPE_LABELS[doc.type]}</Badge>
                          {doc.category && (
                            <Badge variant="outline" className="text-[10px]">
                              {doc.category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span className="font-semibold">{doc.branch ? `فرع ${doc.branch.name}` : 'عامة لجميع الفروع'}</span>
                          {doc.member && (
                            <span>
                              الإطار: {doc.member.firstName} {doc.member.lastName}
                            </span>
                          )}
                          <span>{formatDateDMY(doc.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {doc.visibleToBranch ? (
                          <Badge className="bg-(--flag-green)/15 text-(--flag-green) text-[10px]">
                            <Eye className="h-3 w-3 ml-1" /> معروضة في الفرع
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            <EyeOff className="h-3 w-3 ml-1" /> مؤرشفة بالإدارة
                          </Badge>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setViewDoc(doc)} title="عرض الورقة والطباعة">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleVisible(doc)}
                          title={doc.visibleToBranch ? 'إخفاء من حساب الفرع' : 'إظهار/إرسال إلى حساب الفرع'}
                        >
                          {doc.visibleToBranch ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(doc)} title="تعديل">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeDoc(doc)}
                          className="text-destructive hover:text-destructive"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 3. تبويب مكتبة النماذج والمراجع واستيراد النماذج */}
      {activeOfficeTab === 'templates' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-(--border)">
            <div>
              <h3 className="font-black text-lg text-(--club-dark) flex items-center gap-2">
                <Copy className="h-5 w-5 text-emerald-600" />
                المكتبة المرجعية لنماذج المحررات الإدارية
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                جميع النماذج المعتمدة بالنادي. يمكنك استخدام أي نموذج للإصدار السريع، أو استيراد نموذج جديد وجعله قالباً مرجعياً دائماً.
              </p>
            </div>
            <Button
              onClick={() => setImportModalOpen(true)}
              className="bg-(--club) hover:bg-(--club)/90 text-white font-bold shrink-0 shadow-sm"
            >
              <Upload className="ml-1.5 h-4 w-4" />
              استيراد / إضافة نموذج مرجعي جديد
            </Button>
          </div>

          {/* شبكة النماذج المرجعية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTemplates.map((tpl) => {
              const Icon = TYPE_ICONS[tpl.type] || FileText
              return (
                <div
                  key={tpl.id}
                  className="rounded-2xl bg-white border border-(--border) p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative group"
                >
                  {tpl.isCustom && (
                    <Badge className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px]">
                      مستورد / مخصص
                    </Badge>
                  )}
                  <div>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="h-10 w-10 rounded-xl bg-(--club-light) flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-(--club)" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-(--club-dark)">{tpl.title}</h4>
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {tpl.category}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id)
                        setActiveOfficeTab('quick')
                      }}
                      className="bg-(--club) hover:bg-(--club)/90 text-white font-bold text-xs flex-1"
                    >
                      <Sparkles className="h-3.5 w-3.5 ml-1" />
                      استخدام للإصدار السريع
                    </Button>
                    {tpl.isCustom && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCustomTemplate(tpl.id, tpl.title)}
                        className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        title="حذف النموذج"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* نافذة استيراد / إضافة نموذج مرجعي جديد */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto nice-scroll">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-(--club)" />
              استيراد أو إضافة نموذج مرجعي جديد
            </DialogTitle>
            <DialogDescription>
              أدخل بيانات النموذج ونصّه المرجعي، مع إمكانية استخدام المتغيرات التلقائية مثل {'{{NAME}}'} و{'{{BRANCH}}'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold">عنوان النموذج المرجعي *</Label>
                <Input
                  value={newTemplateForm.title}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, title: e.target.value })}
                  placeholder="مثال: شهادة شكر وتقدير، طلب منحة، استمارة فحص طبي..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">نوع المحرر</Label>
                <Select
                  value={newTemplateForm.type}
                  onValueChange={(v) => setNewTemplateForm({ ...newTemplateForm, type: v as ClubDocumentType })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DOC_TYPE_LABELS) as ClubDocumentType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {DOC_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">التصنيف</Label>
                <Select
                  value={newTemplateForm.category}
                  onValueChange={(v) => setNewTemplateForm({ ...newTemplateForm, category: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">وصف موجز للنموذج</Label>
              <Input
                value={newTemplateForm.description}
                onChange={(e) => setNewTemplateForm({ ...newTemplateForm, description: e.target.value })}
                placeholder="متى ولمن يُصدر هذا النموذج..."
                className="text-xs"
              />
            </div>

            {/* أزرار سريعة لإدراج المتغيرات */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">نص النموذج المرجعي *</Label>
                <label className="text-xs font-bold text-(--club) hover:underline cursor-pointer flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" />
                  استيراد من ملف نصي
                  <input type="file" accept=".txt,.doc,.json" onChange={handleFileImport} className="hidden" />
                </label>
              </div>
              <div className="flex flex-wrap gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-muted-foreground self-center ml-1">انقر لإدراج متغير:</span>
                {[
                  { tag: '{{NAME}}', label: 'الاسم' },
                  { tag: '{{BIRTH_DATE}}', label: 'تاريخ الميلاد' },
                  { tag: '{{BIRTH_PLACE}}', label: 'مكان الميلاد' },
                  { tag: '{{BRANCH}}', label: 'الفرع' },
                  { tag: '{{POSITION}}', label: 'الصفة' },
                  { tag: '{{LICENSE_NO}}', label: 'رقم الرخصة' },
                  { tag: '{{SEASON}}', label: 'الموسم' },
                  { tag: '{{DATE}}', label: 'التاريخ' },
                  { tag: '{{REF}}', label: 'المرجع' },
                  { tag: '{{SUBJECT}}', label: 'الموضوع' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => setNewTemplateForm((prev) => ({ ...prev, content: prev.content + ' ' + item.tag }))}
                    className="text-[10px] font-mono bg-white hover:bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-(--club-dark)"
                  >
                    {item.label} ({item.tag})
                  </button>
                ))}
              </div>
              <Textarea
                value={newTemplateForm.content}
                onChange={(e) => setNewTemplateForm({ ...newTemplateForm, content: e.target.value })}
                rows={8}
                placeholder="اكتب نص النموذج هنا مع استعمال المتغيرات مثل {{NAME}} و {{BRANCH}}..."
                className="font-medium text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setImportModalOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={saveCustomTemplate} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
                <CheckCircle2 className="h-4 w-4 ml-1" />
                حفظ كنموذج مرجعي دائم
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة الإنشاء/التعديل اليدوي الكامل */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto nice-scroll">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-(--club)" />
              {editing ? 'تعديل وثيقة في مكتب النادي' : 'تسجيل وثيقة جديدة في مكتب النادي'}
            </DialogTitle>
            <DialogDescription>
              سجّل بيانات الوثيقة ثم صمّم ورقتها الرسمية بمعاينة حية قبل الحفظ.
            </DialogDescription>
          </DialogHeader>

          {/* تبويبات التعديل */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setFormTab('data')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                formTab === 'data' ? 'bg-(--club) text-white shadow' : 'bg-muted text-(--club-dark) hover:bg-muted/70'
              }`}
            >
              بيانات الوثيقة
            </button>
            <button
              onClick={() => setFormTab('design')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                formTab === 'design' ? 'bg-(--club) text-white shadow' : 'bg-muted text-(--club-dark) hover:bg-muted/70'
              }`}
            >
              <Palette className="h-4 w-4" />
              تصميم الورقة والترويسة
            </button>
          </div>

          {formTab === 'data' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>رقم المرجع</Label>
                <Input
                  value={form.refNumber}
                  onChange={(e) => setForm({ ...form, refNumber: e.target.value })}
                  placeholder="CRS/2026/001"
                  dir="ltr"
                  className="text-left font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>نوع الوثيقة *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ClubDocumentType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DOC_TYPE_LABELS) as ClubDocumentType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {DOC_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>عنوان الوثيقة *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: محضر تنصيب مكتب فرع كرة القدم"
                />
              </div>
              <div className="space-y-1.5">
                <Label>التصنيف</Label>
                <Select
                  value={form.category || '__none'}
                  onValueChange={(v) => setForm({ ...form, category: v === '__none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">بلا تصنيف</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الفرع المعني</Label>
                <Select
                  value={form.branchId || '__general'}
                  onValueChange={(v) => setForm({ ...form, branchId: v === '__general' ? '' : v, memberId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__general">عامة لجميع الفروع</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>نص الوثيقة *</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={7}
                  placeholder="اكتب نص الوثيقة..."
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-(--border) bg-muted/40 p-3.5">
                <div>
                  <div className="font-bold text-sm text-(--club-dark)">إظهار في حساب الفرع</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    تظهر هذه الوثيقة مباشرة في مكتب الفرع المعني بحسابه.
                  </p>
                </div>
                <Switch
                  checked={form.visibleToBranch}
                  onCheckedChange={(v) => setForm({ ...form, visibleToBranch: v })}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>نمط الورقة</Label>
                  <Select
                    value={design.style}
                    onValueChange={(v) => setDesign({ ...design, style: v as DocumentDesign['style'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="official">رسمي (إداري)</SelectItem>
                      <SelectItem value="minimal">مبسّط</SelectItem>
                      <SelectItem value="ceremonial">احتفالي (شهادات وشكر)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>لون الإطار والختم</Label>
                  <Select
                    value={design.accent}
                    onValueChange={(v) => setDesign({ ...design, accent: v as DocumentDesign['accent'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="navy">كحلي رسمي</SelectItem>
                      <SelectItem value="silver">فضي</SelectItem>
                      <SelectItem value="red">أحمر جزائري</SelectItem>
                      <SelectItem value="green">أخضر جزائري</SelectItem>
                      <SelectItem value="gold">ذهبي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>اسم الموقّع</Label>
                  <Input
                    value={design.signatureName}
                    onChange={(e) => setDesign({ ...design, signatureName: e.target.value })}
                    placeholder="رئيس النادي"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label className="cursor-pointer">شعار النادي في الترويسة</Label>
                  <Switch checked={design.showLogo} onCheckedChange={(v) => setDesign({ ...design, showLogo: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="cursor-pointer flex items-center gap-1.5">
                    <Stamp className="h-4 w-4" /> الختم الرسمي
                  </Label>
                  <Switch checked={design.showStamp} onCheckedChange={(v) => setDesign({ ...design, showStamp: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="cursor-pointer">العلامة المائية (شعار خلفي)</Label>
                  <Switch
                    checked={design.showWatermark}
                    onCheckedChange={(v) => setDesign({ ...design, showWatermark: v })}
                  />
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-(--club-dark) mb-2 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> معاينة حية للورقة
                </div>
                <div className="max-h-[430px] overflow-y-auto nice-scroll rounded-xl bg-muted/50 p-3">
                  <DocumentPaper
                    compact
                    doc={{
                      refNumber: form.refNumber,
                      title: form.title || 'عنوان الوثيقة',
                      type: form.type,
                      category: form.category,
                      content: form.content || 'نص الوثيقة يظهر هنا...',
                      design: JSON.stringify(design),
                      createdAt: new Date().toISOString(),
                      member: null,
                      branch: branches.find((b) => b.id === form.branchId)
                        ? {
                            name: branches.find((b) => b.id === form.branchId)!.name,
                            slug: branches.find((b) => b.id === form.branchId)!.slug,
                            color: branches.find((b) => b.id === form.branchId)!.color,
                          }
                        : null,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--border)">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button
              onClick={saveEditedDoc}
              disabled={saving}
              className="bg-(--club) hover:bg-(--club)/90 text-white font-bold"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Briefcase className="h-4 w-4 ml-1" />}
              {editing ? 'حفظ التعديلات' : 'تسجيل في مكتب النادي'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة عرض الورقة والطباعة المباشرة */}
      <Dialog open={!!viewDoc} onOpenChange={(v) => !v && setViewDoc(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto nice-scroll">
          <DialogHeader className="doc-print-hide">
            <DialogTitle>عرض الورقة الرسمية</DialogTitle>
            <DialogDescription>{viewDoc?.title}</DialogDescription>
          </DialogHeader>
          {viewDoc && (
            <>
              <DocumentPaper id="view-doc-modal-paper" doc={viewDoc} />
              <div className="flex justify-end gap-2 doc-print-hide mt-3">
                <Button variant="outline" onClick={() => setViewDoc(null)}>
                  إغلاق
                </Button>
                <Button
                  onClick={() => printClubDocument('view-doc-modal-paper')}
                  className="bg-(--club) hover:bg-(--club)/90 text-white font-bold"
                >
                  <Printer className="h-4 w-4 ml-1" /> طباعة الورقة A4
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SaveIcon(props: { className?: string }) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}
