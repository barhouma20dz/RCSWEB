export interface BranchSummary {
  id: string
  slug: string
  name: string
  motto: string
  description: string
  icon: string
  color: string
  image: string
  visible: boolean
  sortOrder: number
  _count?: { players: number; news: number; matches: number }
}

export interface BranchRef {
  name: string
  slug: string
  color: string
}

export interface NewsItem {
  id: string
  title: string
  content: string
  image: string
  featured: boolean
  branchId: string
  branch: BranchRef
  createdAt: string
}

export interface MatchItem {
  id: string
  opponent: string
  date: string
  venue: string
  location: string
  competition: string
  homeScore: number | null
  awayScore: number | null
  status: string
  branchId: string
  branch: BranchRef
}

export interface AchievementItem {
  id: string
  title: string
  year: string
  description: string
  branchId: string | null
  branch: BranchRef | null
}

export interface GalleryImage {
  id: string
  url: string
  caption: string
  branchId: string | null
  branch: BranchRef | null
}

export interface PlayerItem {
  id: string
  name: string
  position: string
  number: number | null
  age: number | null
  photo: string
}

export interface TrainingItem {
  id: string
  day: string
  time: string
  location: string
  coach: string
  groupName: string
}

export interface EnrollmentItem {
  id: string
  firstName: string
  lastName: string
  fullName: string
  gender: string // male | female | '' (طلبات قديمة)
  birthDate: string
  age: number
  address: string // العنوان (للبالغ أو عنوان ولي الأمر للقاصر)
  phone: string // الهاتف (للبالغ أو هاتف ولي الأمر للقاصر)
  parentName: string // ولي الأمر (للقاصر)
  note: string
  status: string
  createdAt: string
}

export interface StandingItem {
  id: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

export interface VideoItem {
  id: string
  title: string
  url: string
  thumb: string
  branchId: string | null
  branch: BranchRef | null
}

export interface ProductItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  active: boolean
}

export interface ShopOrderItem {
  id: string
  customerName: string
  phone: string
  size: string
  note: string
  status: string
  createdAt: string
  product: { id: string; name: string; price: number; image: string }
}

export interface ContactMessageItem {
  id: string
  name: string
  email: string
  phone: string
  message: string
  createdAt: string
}

export interface AdminAccount {
  username: string
  name: string
}

export interface BranchMemberItem {
  id: string
  firstName: string
  lastName: string
  birthDate: string
  position: string
  specialty: string
  phone: string
  appointedAt: string
  notes: string
  sortOrder: number
  branchId: string
  branch?: BranchRef
  documentsCount?: number
  createdAt: string
}

export type ClubDocumentType = 'file' | 'minute' | 'letter' | 'request' | 'design' | 'issued'

export interface ClubDocumentItem {
  id: string
  refNumber: string
  title: string
  type: ClubDocumentType
  category: string
  content: string
  design: string
  memberId: string | null
  member: { id: string; firstName: string; lastName: string; position: string } | null
  branchId: string | null
  branch: BranchRef | null
  visibleToBranch: boolean
  templateId?: string | null
  issuedValues?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** قالب من مكتب النادي — نموذج قابل للإصدار أو مرجع للقراءة */
export interface DocumentTemplateItem {
  id: string
  name: string
  kind: 'template' | 'reference' | string
  category: string
  fileType: 'image' | 'pdf' | string
  fields: TemplateField[]
  active: boolean
  createdAt: string
  updatedAt: string
  fileData?: string // يُجلب فقط عند الطلب (المعاينة/الإصدار)
}

/** حقل نصي قابل للتعبئة فوق قالب — الإحداثيات نسب مئوية من صفحة A4 */
export interface TemplateField {
  key: string
  label: string
  x: number // 0-100 %
  y: number // 0-100 %
  w: number // عرض الصندوق %
  size: number // حجم الخط pt
  bold: boolean
}

/** إحصائيات الصفحة الرئيسية — القابلة للتعديل من الإدارة */
export interface EditableStats {
  foundationYear?: number // سنة التأسيس
  fansCount?: number // عدد المشجعين
  medalsCount?: number // الميداليات
  titlesCount?: number // الألقاب (إن تُرك فارغاً حُسبت من الإنجازات المسجلة)
}

/** نصوص ترويسة قسم من أقسام الصفحة الرئيسية (بثلاث لغات) */
export interface SectionTexts {
  eyebrow?: Partial<Record<string, string>>
  title?: Partial<Record<string, string>>
  titleGold?: Partial<Record<string, string>>
  subtitle?: Partial<Record<string, string>>
}

/** إعدادات تصميم الواجهة الرئيسية — كل الحقول اختيارية مع قيم افتراضية */
export interface SiteSettings {
  hero?: {
    title1?: Partial<Record<string, string>>
    titleGold?: Partial<Record<string, string>>
    subtitle?: Partial<Record<string, string>>
    desc?: Partial<Record<string, string>>
    descTail?: Partial<Record<string, string>>
  }
  about?: {
    title?: Partial<Record<string, string>>
    subtitle?: Partial<Record<string, string>>
  }
  contact?: {
    address?: string
    addressLines?: string[] // أسطر العنوان المتعددة (تظهر كأسطر في بطاقة العنوان)
    phone?: string
    phones?: string[] // أرقام هواتف متعددة
    email?: string
    emails?: string[] // بريد إلكتروني متعدد
    facebook?: string
    instagram?: string
    youtube?: string
  }
  /** إعدادات نافذة استمارة الانخراط — تتحكم بالحقول والإلزامية حسب العمر */
  enrollment?: {
    adultAge?: number // سن الرشد (افتراضياً 18) — تحته تظهر معلومات ولي الأمر
    showGender?: boolean
    showNote?: boolean
    requirePhone?: boolean
    requireAddress?: boolean
    guardianTitle?: string // عنوان قسم معلومات ولي الأمر
    adultTitle?: string // عنوان قسم معلومات المنخرط البالغ
    notice?: Partial<Record<'ar' | 'fr' | 'en', string>> // إشعار يظهر أعلى الاستمارة
  }
  design?: {
    accent?: string // silver | gold | red | green | rose
    heroImage?: string // خلفية الواجهة الرئيسية (رابط أو من المعرض الجاهز)
    showStats?: boolean
    watermark?: boolean
    overlay?: number
    season?: string // موسم الانخراط الظاهر في الاستمارة (مثل 2026/2027)
  }
  sections?: {
    about?: boolean
    branches?: boolean
    news?: boolean
    matches?: boolean
    achievements?: boolean
    gallery?: boolean
    videos?: boolean
    shop?: boolean
    join?: boolean
    contact?: boolean
  }
  /** عناوين أقسام الصفحة الرئيسية حسب الذوق (تتجاوز النصوص الافتراضية) */
  texts?: Partial<Record<string, SectionTexts>>
  /** إحصائيات الصفحة الرئيسية القابلة للتعديل (عدد اللاعبين والفروع يُحسبان تلقائياً من الفروع) */
  stats?: EditableStats
  /** محتوى تحريري: كلمة رئيس النادي وغيرها */
  content?: {
    presidentWord?: {
      text?: Partial<Record<'ar' | 'fr' | 'en', string>>
      name?: string
      role?: string
    }
  }
  languages?: { ar?: boolean; fr?: boolean; en?: boolean }
}

export interface BranchWithAccount extends BranchSummary {
  accountUsername: string | null
  counts: { players: number; news: number; matches: number; enrollments: number; trainings: number; gallery: number }
}

export type SectionKey =
  | 'about'
  | 'branches'
  | 'news'
  | 'matches'
  | 'achievements'
  | 'gallery'
  | 'shop'
  | 'join'
  | 'contact'

export interface HomeData {
  branches: BranchSummary[]
  news: NewsItem[]
  upcoming: MatchItem[]
  results: MatchItem[]
  achievements: AchievementItem[]
  gallery: GalleryImage[]
  videos: VideoItem[]
  products: ProductItem[]
  settings: SiteSettings | null
  stats: {
    branchesCount: number
    playersCount: number
    titlesCount: number
    foundationYear: number
    fansCount: number
    medalsCount: number
  }
}

export interface BranchDetail extends BranchSummary {
  news: NewsItem[]
  players: PlayerItem[]
  trainings: TrainingItem[]
  achievements: AchievementItem[]
  gallery: GalleryImage[]
  upcoming: MatchItem[]
  results: MatchItem[]
  standings: StandingItem[]
  videos: VideoItem[]
}

export interface OfficeAccount {
  username: string
  branch: {
    id: string
    slug: string
    name: string
    motto: string
    color: string
    image: string
  }
}

export interface OfficeData {
  branch: {
    id: string
    slug: string
    name: string
    motto: string
    description: string
    color: string
    image: string
  }
  news: NewsItem[]
  players: PlayerItem[]
  matches: MatchItem[]
  trainings: TrainingItem[]
  enrollments: EnrollmentItem[]
  gallery: GalleryImage[]
  standings: StandingItem[]
  videos: VideoItem[]
  members: BranchMemberItem[]
  documents: ClubDocumentItem[]
  stats: {
    playersCount: number
    newsCount: number
    upcomingCount: number
    pendingEnrollments: number
    galleryCount: number
    trainingsCount: number
    standingsCount: number
    videosCount: number
    membersCount: number
    documentsCount: number
  }
}

export interface AdminData {
  stats: {
    branchesCount: number
    newsCount: number
    playersCount: number
    matchesCount: number
    pendingEnrollments: number
    messagesCount: number
    pendingOrders: number
    membersCount: number
    documentsCount: number
  }
  branches: BranchWithAccount[]
  news: NewsItem[]
  enrollments: (EnrollmentItem & { branch: BranchRef })[]
  messages: ContactMessageItem[]
  orders: ShopOrderItem[]
  products: ProductItem[]
  members: BranchMemberItem[]
  documents: ClubDocumentItem[]
  achievements: AchievementItem[]
  templates: DocumentTemplateItem[]
  settings: SiteSettings | null
}
