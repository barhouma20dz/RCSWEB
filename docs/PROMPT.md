# 🚀 البرومبت التفصيلي v6.0 — انسخه كما هو وألصقه في أي أداة ذكاء اصطناعي (Cursor / v0 / Bolt / Claude / ChatGPT)

> هذا هو **البرومبت الكامل النهائي** للمشروع الاحترافي — يُعيد بناء الموقع كاملاً بنفس المواصفات المنفذة فعلياً،
> **بالهوية الرسمية المعتمدة من شعار النادي** (الكحلي × الفضي × الأحمر والأخضر الجزائريين)، ويشمل:
> لوحة الإدارة المركزية بـ **كتب النادي ومصمم الأوراق الرسمي** و**إطارات الفروع** و**إعدادات وتصميم الواجهة الرئيسية**،
> **وضع ليلي/نهاري كامل**، **استمارة انخراط نهاري احترافية** تُرسل مباشرة إلى الفرع المحدد فيها،
> **تعديل وحذف في كل صفحة** بالمكاتب والإدارة، 12 فرعاً بمكاتب رقمية، **ثلاث لغات (العربية/الفرنسية/الإنجليزية)**،
> جداول الترتيب، الفيديوهات، المتجر، تتبع الطلبات، تطبيق PWA، ونظام مصادقة مزدوج (Bearer Token + Cookie) يعمل حتى داخل إطارات iframe.

---

## ⬇️ البرومبت (نسخ من هنا)

```text
أنت مهندس ويب Full-Stack أول ومصمم واجهات عالمي المستوى. ابنِ منصة ويب متكاملة من الصفر
بدون أي أسئلة، ونفّذ الواجهة أولاً ثم الخلفية، وتحقق من النتيجة في المتصفح بعد كل مرحلة.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 المشروع
━━━━━━━━━━━━━━━━━━━━━━━━━━
«الموقع الرسمي لنادي الرائد الرياضي المتعدد الرياضات — بلدية سعيدة، الجزائر»
الاسم الرسمي بالفرنسية: Club Sportif Amateur Omnisports Rayed — APC de Saïda
تاريخ التأسيس: 2024 — شعار النادي: «قوة في الوحدة.. تميز في الأداء»

الموقع من أربع طبقات:
1) واجهة عامة فخمة بثلاث لغات (عربية RTL / فرنسية / إنجليزية) ووضعين ليلي/نهاري
   تعرض النادي وشعاره الرسمي وصوره وأخباره ومبارياته وفيديوهاته ومتجره
   — وتستجيب لإعدادات التصميم التي يضبطها مدير النادي.
2) «مكتب رقمي» لكل فرع رياضي (12 فرعاً)، يُدخل فقط بحساب (اسم مستخدم + كلمة مرور)،
   ويحتوي لوحة إدارة كاملة باثني عشر قسماً **بتعديل وحذف في كل شيء** — مع عزل تام بين بيانات الفروع.
3) «لوحة إدارة مركزية» لمدير النادي العام: تُنشئ الفروع وحسابات مكاتبها، وتُسجّل
   «كتب النادي» (محاضر التنصيب، ملفات الإطارات، المراسلات، الطلبات، تصاميم الأوراق)
   بمصمم أوراق رسمي، وتُعيّن إطارات كل فرع، وتُصمم الواجهة الرئيسية حسب ذوقها وتحدد موسم الانخراط.
4) استمارة انخراط نهاري احترافية (بطاقات اختيار الفرع + كل حقول الملف الشخصي)
   يصل طلبها مباشرة إلى مكتب الفرع المحدد، + تواصل + متجر + تتبع طلبات.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ الشعار الرسمي والهوية البصرية (أهم قسم — التزم حرفياً)
━━━━━━━━━━━━━━━━━━━━━━━━━━
الشعار الرسمي للنادي: ختم على شكل درع بإطار فضي معدني، داخله خلفية كحلية منقّطة،
يتوسطه حرف C أخضر وحرف S أحمر يلتفان حول صقر أسود يشكّل حرف R،
يعلوه قوس من خمس نجوم فضية، ويليه شريطان فضيان منقوشان:
«CLUB SPORTIF AMATEUR OMNISPORTS RAYED» ثم «APC DE SAÏDA»،
يحوط الدرع غصنا غار فضيان وتختتم بطاقة سفلية «EST. 2024».
⚠️ الدرع بأغصان الغار «أطول من عرضه» (نسبة ≈ 0.85 عمودي) — يُمنع منعاً باتاً
قصه من الجانبين ليلائم مربعاً؛ يُعرض كاملاً دائماً.

عالج ملف الشعار الأصلي (PNG شفاف) بـ PIL/sharp إلى:
- public/images/logo-full.png  → الدرع الكامل بأغصانه (عرض 1000px، ارتفاع ≈1170px) — لعرض Hero
- public/images/logo.png       → الدرع الكامل مركّزاً داخل مربع 1200px بخلفية شفافة (object-contain)
- public/images/logo-wide.png  → الدرع الكامل 900px (العلامة المائية)
- أيقونات PWA: icon-192/icon-512 (درع كامل على خلفية كحلية #0f1b3a)
  + icon-maskable-512 (الدرع ضمن 74% من الأمان) + apple-touch-icon 180px

اللوحة الرسمية المستخرجة من الشعار (ممنوع الخروج عنها):
- الكحلي العميق  #0f1b3a  → الخلفيات الداكنة (club-gradient) وثيم PWA وthemeColor
- الكحلي الأساسي #1d2f5e  → الأزرار والعناوين والتمييز على الفاتح (--primary / --club)
- الفضي المعدني  #d6dce8  → كل التمييز فوق الخلفيات الداكنة (--silver) بدل الذهبي
- الأحمر الجزائري #d21034 → لمسات الحيوية، أسعار المتجر، أيقونات عناوين الفاتح (--flag-red)
- الأخضر الجزائري #006233 → حالات النجاح والتأكيد (--flag-green)

قواعد التطبيق الإلزامية:
- الفضي فوق الداكن فقط؛ فوق الفاتح استخدم الكحلي للنصوص والأحمر الجزائري لللمسات
- ممنوع الذهبي، وممنوع الأزرق/النيلي الافتراضي لـ Tailwind
- .club-gradient: تدرج 135deg كحلي عميق → كحلي أفتح → كحلي عميق
- .silver-text: تدرج معدني عبر متغيرات (--accent-light/deep/deep2) بقص نص،
  قابلة لإعادة التلوين حياً من إعدادات الإدارة (5 لوحات جاهزة)
- .dark-hero-overlay و.glass بطبقات كحلية شفافة، .logo-glow هالة فضية،
  .animate-pulse-ring نبضة فضية، .subtle-pattern نقاط كحلية خفيفة
- عرض الشعار في Hero: الدرع الكامل logo-full.png object-contain (ارتفاع 144–208px)
  داخل مربع بنبضة فضية وعوامة بطيئة + علامة مائية للختم الكامل بشفافية 5%
- في الشريط والتذييل: الدرع داخل دائرة «عملة معدنية» بحلقة فضية object-contain
- dir="rtl" و lang="ar" على مستوى html (تتبدل تلقائياً إلى ltr مع الفرنسية/الإنجليزية)
- الخط: Cairo بأوزان 400–900
- زوايا مستديرة rounded-2xl، ظلال ناعمة، تأثيرات hover تكبر البطاقة قليلاً
- تجاوب كامل من 360px حتى 4K، أهداف لمس ≥ 44px، footer لاصق
  (min-h-screen flex flex-col + التذييل mt-auto)
- كل الصور لها alt نصي، والأزرار aria-label

━━━━━━━━━━━━━━━━━━━━━━━━━━
🧱 التقنيات (إلزامية)
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Next.js 16 (App Router) + TypeScript صارم
- Tailwind CSS 4 + shadcn/ui (New York) + أيقونات Lucide
- Prisma + SQLite — الملف في db/custom.db — الوصول عبر import { db } from '@/lib/db'
- API Routes فقط (لا Server Actions)
- Framer Motion للحركات + Zustand لحالة اللغة وإعدادات الموقع
- تشغيل على المنفذ 3000، التحقق من سجل dev.log بعد كل تعديل

━━━━━━━━━━━━━━━━━━━━━━━━━━
🗄 مخطط Prisma (18 نموذجاً — اكتبها كما هي)
━━━━━━━━━━━━━━━━━━━━━━━━━━
model Branch {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  motto       String   @default("")
  description String   @default("")
  icon        String   @default("Trophy")   // اسم أيقونة Lucide
  color       String   @default("#16a34a")
  image       String   @default("")
  visible     Boolean  @default(true)   // إظهار أو إخفاء الفرع من الموقع كاملاً (أمر الإدارة)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  account      BranchAccount?
  news         News[]
  players      Player[]
  matches      Match[]
  trainings    Training[]
  enrollments  Enrollment[]
  gallery      GalleryItem[]
  achievements Achievement[]
  standings    Standing[]
  videos       VideoItem[]
  members      BranchMember[]
  documents    ClubDocument[]
}

model Admin {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  name         String   @default("مدير النادي")
  createdAt    DateTime @default(now())
}

model BranchMember {   // إطارات وأعضاء الفروع
  id          String   @id @default(cuid())
  firstName   String   // الاسم
  lastName    String   // اللقب
  birthDate   String   @default("") // تاريخ الميلاد
  position    String   @default("عضو") // المنصب في الفرع
  specialty   String   @default("") // التخصص
  phone       String   @default("")
  appointedAt String   @default("") // تاريخ التعيين
  notes       String   @default("")
  sortOrder   Int      @default(0)  // ترتيب هرمي تلقائي حسب المنصب
  branchId    String
  branch      Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  documents   ClubDocument[]
  createdAt   DateTime @default(now())
}

model ClubDocument {   // كتب النادي: ملفات ومحاضر ومراسلات وتصاميم أوراق
  id              String        @id @default(cuid())
  refNumber       String        @default("") // رقم المرجع CRS/سنة/رقم
  title           String
  type            String        @default("file") // file|minute|letter|request|design
  category        String        @default("") // محاضر التنصيب، ملفات الإطارات، ...
  content         String        @default("") // نص الوثيقة (يحفظ الأسطر)
  design          String        @default("") // JSON تصميم الورقة
  memberId        String?       // الإطار المعني بالوثيقة
  member          BranchMember? @relation(fields: [memberId], references: [id], onDelete: SetNull)
  branchId        String?       // الفرع المعني (null = عامة لجميع الفروع)
  branch          Branch?       @relation(fields: [branchId], references: [id], onDelete: SetNull)
  visibleToBranch Boolean       @default(false) // أمر الإدارة: إظهار/إرسال إلى حساب الفرع
  createdBy       String        @default("الإدارة العامة")
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model SiteSetting {   // إعدادات وتصميم الواجهة الرئيسية (JSON بمفتاح "site")
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}

model Standing {   // جدول ترتيب الدوري لكل فرع
  id           String @id @default(cuid())
  teamName     String
  played       Int    @default(0)
  won          Int    @default(0)
  drawn        Int    @default(0)
  lost         Int    @default(0)
  goalsFor     Int    @default(0)
  goalsAgainst Int    @default(0)
  points       Int    @default(0)
  branchId     String
  branch       Branch @relation(fields: [branchId], references: [id], onDelete: Cascade)
}

model VideoItem {   // فيديوهات mp4 محلية أو يوتيوب
  id        String   @id @default(cuid())
  title     String
  url       String
  thumb     String   @default("")
  branchId  String?
  branch    Branch?  @relation(fields: [branchId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
}

model Product {   // متجر النادي
  id          String      @id @default(cuid())
  name        String
  description String      @default("")
  price       Int         // بالدينار الجزائري
  image       String      @default("")
  category    String      @default("ملابس")
  active      Boolean     @default(true)
  createdAt   DateTime    @default(now())
  orders      ShopOrder[]
}

model ShopOrder {
  id           String   @id @default(cuid())
  customerName String
  phone        String
  size         String   @default("")
  note         String   @default("")
  status       String   @default("pending")   // pending | done
  productId    String
  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
}

model BranchAccount {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  branchId     String   @unique
  branch       Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
}

model News {
  id        String   @id @default(cuid())
  title     String
  content   String   @default("")
  image     String   @default("")
  featured  Boolean  @default(false)
  branchId  String
  branch    Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Player {
  id        String   @id @default(cuid())
  name      String
  position  String   @default("")
  number    Int?
  age       Int?
  photo     String   @default("")
  branchId  String
  branch    Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model Match {
  id          String   @id @default(cuid())
  opponent    String
  date        DateTime
  venue       String   @default("home")   // home | away
  location    String   @default("")
  competition String   @default("")
  homeScore   Int?
  awayScore   Int?
  status      String   @default("upcoming")   // upcoming | finished
  branchId    String
  branch      Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
}

model Training {
  id        String @id @default(cuid())
  day       String
  time      String
  location  String @default("")
  coach     String @default("")
  groupName String @default("")
  branchId  String
  branch    Branch @relation(fields: [branchId], references: [id], onDelete: Cascade)
}

model Enrollment {   // استمارة الانخراط النهاري — تُرسل إلى الفرع المحدد
  id          String   @id @default(cuid())
  firstName   String   @default("") // الاسم الشخصي
  lastName    String   @default("") // اللقب
  fullName    String // الاسم الكامل (مخزّن للعرض السريع)
  gender      String   @default("") // male | female
  birthDate   String   @default("") // تاريخ الميلاد YYYY-MM-DD (تُعرض شهر/يوم/سنة)
  address     String   @default("") // العنوان (الشخصي للبالغ — عنوان ولي الأمر للقاصر)
  parentName  String   @default("") // اسم ولي الأمر (إلزامي للأقل من 18 سنة)
  age         Int // يُحتسب تلقائياً من تاريخ الميلاد
  phone       String
  note        String   @default("")
  status      String   @default("pending")   // pending | accepted | rejected
  branchId    String
  branch      Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
}

model GalleryItem {
  id        String   @id @default(cuid())
  url       String
  caption   String   @default("")
  branchId  String?
  branch    Branch?  @relation(fields: [branchId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
}

model Achievement {
  id          String  @id @default(cuid())
  title       String
  year        String
  description String  @default("")
  branchId    String?
  branch      Branch? @relation(fields: [branchId], references: [id], onDelete: SetNull)
  createdAt   DateTime @default(now())
}

model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String   @default("")
  phone     String   @default("")
  message   String
  createdAt DateTime @default(now())
}

━━━━━━━━━━━━━━━━━━━━━━━━━━
🔌 واجهات API (20 مساراً)
━━━━━━━━━━━━━━━━━━━━━━━━━━
عامة:
- GET  /api/public/home      → فروع + أخبار + مباريات + إنجازات + معرض + videos + products + settings (إعدادات التصميم)
  ⚠️ يفلتر كل شيء بالفروع الظاهرة فقط (branch.visible=true): الفروع والأخبار والمباريات
  والإنجازات والمعرض والفيديوهات (مع OR branch null) وعدادات اللاعبين والفروع —
  إخفاء الفرع يُسقطه فوراً من كل هذه الأقسام
- GET  /api/public/branch?slug=x → تفاصيل فرع + standings مرتبة بالنقاط + أخباره ولاعبوه ومبارياته وتداريبه وفيديوهاته
  ⚠️ الفرع المخفي يرد 404 برسالة «هذا الفرع غير متاح حالياً»
- POST /api/public/enroll    → استمارة الانخراط النهاري (zod:
  firstName, lastName, gender male|female, birthDate, parentName?, address?,
  phone, branchId, note?) — العمر يُحتسب من تاريخ الميلاد، وولي الأمر إلزامي
  للأقل من 18 سنة، والرسالة تعيد اسم الفرع الذي وصل إليه الطلب
- POST /api/public/contact   → رسالة تواصل (zod)
- POST /api/public/order     → طلب متجر { productId, customerName, phone, size?, note? } → ShopOrder pending
- POST /api/public/enroll-status → تتبع طلبات الانضمام برقم الهاتف { phone } →
  { requests:[{ id, fullName, status, createdAt, branch:{ name, color } }] }
  مع مطابقة مرنة للهاتف (يتجاهل الفواصل والشرطات)

المصادقة (دوران: office | admin):
- POST /api/auth/login   → يتحقق من BranchAccount ثم Admin →
  { success, role:'office', token, account:{ username, branch:{...} } }
  أو { success, role:'admin', token, admin:{ username, name } }
  أو 401 برسالة عربية. يضبط كوكي httpOnly أيضاً.
- POST /api/auth/logout  → حذف الكوكي
- GET  /api/auth/me      → { account } أو { admin } أو {} — لاستعادة الجلسة

مكتب الفرع (401 بدون جلسة office، تُقيَّد بـ branchId من الجلسة لا من الطلب):
- GET  /api/office/data   → الفرع + كل بياناته + standings + videos
  + members (أعضاء الفرع مرتبين هرمياً) + documents (الوثائق الواردة:
  visibleToBranch=true و(branchId=فرعه أو null للعامة)) + إحصائيات شاملة
- POST /api/office/items      → { action: create|update|delete,
                                  type: news|players|matches|trainings|gallery|standing|video|member, id?, data? }
                                  — standing يحسب النقاط تلقائياً (فوز3/تعادل1) ويُرتّب تنازلياً
                                  — member: أعضاء الفرع بأمر المكتب (إضافة/تعديل/حذف)
                                    بنفس الترتيب الهرمي التلقائي حسب المنصب،
                                    مقيداً دائماً بفرع الجلسة (لا يمكن لمكتب العبث بفرع آخر)
- POST /api/office/enrollments → قبول/رفض طلب انضمام { id, status }
- DELETE /api/office/enrollments → حذف طلب انضمام { id } (لخطأ أو إساءة) — مقيّد بفرع الجلسة

الإدارة المركزية (401 بدون جلسة admin):
- GET  /api/admin/data        → إحصائيات 9 عدادات (منها membersCount وdocumentsCount)
  + الفروع مع حساباتها وعداداتها الست + الأخبار + الطلبات + الرسائل + طلبات المتجر مع المنتج
  + المنتجات + members (72 إطاراً مع الفرع وعدد ملفات كل واحد) + documents (مع الإطار والفرع)
  + settings (كائن الإعدادات المحفوظ)
- POST /api/admin/branches    → { action: create|update|delete, data, credentials?{username,password} }
                                — slug فريد lowercase، sortOrder تلقائي، إنشاء اختياري لحساب المكتب داخل $transaction
                                — create/update يقبلان visible: Boolean (إظهار/إخفاء الفرع من الموقع)
- POST /api/admin/accounts    → upsert حساب مكتب { branchId, username, password≥6 }
- POST /api/admin/items       → { action, type: news|enrollment|message|product|order|video, id?, data? }
                                — enrollment/order تحديث حالة فقط، message حذف فقط، order يرفض create
                                — كل الطبقات (الطلبات/المنتجات/الأخبار) تعرض تعديل وحذف كاملين
- POST /api/admin/members     → { action: create|update|delete, id?, data }
                                — الترتيب الهرمي يُحتسب تلقائياً من المنصب:
                                رئيس الفرع ← نائب رئيس الفرع ← الأمين العام للفرع ← المدير التقني للفرع
                                ← نائب المدير التقني ← مدرب ← عضو مكتب الفرع ← عضو
- POST /api/admin/documents   → { action: create|update|delete|show|hide, id?, data? }
                                — show/hide = أمر الإدارة بإظهار/إخفاء الوثيقة في حساب الفرع
                                — design يُحفظ JSON نصي
- GET/POST /api/admin/settings → قراءة/حفظ كائن إعدادات الموقع (upsert بمفتاح site)

━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 نظام المصادقة والأمان (مزدوج — نقطة حرجة)
━━━━━━━━━━━━━━━━━━━━━━━━━━
- تشفير كلمات المرور: scrypt (ملح 16 بايت + تجزئة 64 بايت) بصيغة "salt:hash"
- مقارنة ثابتة الزمن timingSafeEqual
- الجلسة: توكن base64url(payload) + توقيع HMAC-SHA256 بمفتاح سري من .env (AUTH_SECRET — لا سر افتراضياً، غيابه يوقف التشغيل fail-closed)،
  payload = { role:'office'|'admin', accountId, branchId?, iat, exp } وصلاحية 24 ساعة
- إبطال الجلسات: tokenInvalidBefore على حسابي Admin/BranchAccount — أي توكن صدر قبل تغيير كلمة المرور يُرفض فوراً
- ضد القوة الغاشمة (src/lib/rate-limit.ts): قفل حساب بعد 5 إخفاقات (10 دقائق) + حد 25 محاولة/5 دقائق لكل IP + حدود النماذج العامة 8/10 دقائق + استعلام الحالة 10/10 دقائق ويتطلب الهاتف + اللقب معاً (خصوصية)
- الترويسات الأمنية عبر next.config.ts: nosniff / Referrer-Policy / Permissions-Policy / HSTS
- سجل تدقيق أمني: موديل SecurityEvent (دخول ناجح/فاشل، أقفال، تجاوز حدود، تغيير كلمات مرور) يُعرض في تبويب «الأمان والحسابات» بلوحة الإدارة + تنبيه أحمر للكلمة الافتراضية + تغيير كلمة مرور للإدارة وللمكاتب
- اختبار اختراق دائم: scripts/pentest.ts (34 اختباراً) — النتيجة 33✅/1⚠️ (ال⚠️ إجراء إداري: تغيير admin123) — التفاصيل في docs/SECURITY.md
- ⚠️ التسليم مزدوج إلزامياً:
  1) التوكن يُعاد في جسم استجابة الدخول (حقل token) ويُخزّن العميل في
     localStorage بمفتاح raed-session-token، ويُرسل لاحقاً في ترويسة
     Authorization: Bearer <token> عبر دالة مساعدة apiFetch في src/lib/session.ts
  2) كوكي httpOnly SameSite=Lax كخطة بديلة للوصول المباشر
  والسبب: لوحات المعاينة وiframe عبر نطاقات مختلفة تحجب الكوكيز،
  والترويسة تعمل في كل البيئات — دوال الجلسة تقرأ الترويسة أولاً ثم الكوكي
- عزل الأدوار: getSessionAccount تعمل فقط لدور office، وgetSessionAdmin فقط لدور admin
- كل استعلامات المكتب تُرشَّح بـ branchId من الجلسة، وكل مسارات الإدارة تتطلب دور admin
- zod للتحقق من كل مدخلات POST مع رسائل خطأ عربية واضحة
- منع حجز اسم مستخدم مكتب يتعارض مع اسم حساب الإدارة

━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥 الواجهة الرئيسية (صفحة واحدة page.tsx بتبديل view: home|office|admin)
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ الوضع الليلي/النهاري (نظام ثيم مزدوج):
- الليلي هو الافتراضي (هوية النادي الكحلية) — أداة toggle (شمس/قمر) في الشريط وقائمة الجوال
- مخزن zustand بمفتاح raed-theme (persist) + سكربت inline في layout يطبّق الثيم المحفوظ
  قبل الرسم (بلا وميض) عبر صنف light على <html> + تحديث meta theme-color
- رمز نصي موحّد --paper عبر @theme inline (--color-paper): أبيض فوق الأسطح الملوّنة ليلاً،
  كحلي نهاراً — فتُستعمل text-paper وbg-paper/10 وborder-paper/15 في كل المكونات العامة
- تجاوزات CSS مركزية تحت html.light: club-gradient يصير تدرجاً فضياً فاتحاً،
  glass زجاج أبيض، dark-hero-overlay حجاب فاتح، subtle-pattern نقاط داكنة،
  silver-text يُعمّق للتدرج الكحلي المعدني (استعمل background-image لا background حتى لا تُصفّر
  background-clip)، ظلال وشرائط تمرير أخف — والعناصر ذات الخلفيات الكحلية الصريحة
  (جداول الترتيب، التذييل، شارات الألوان) تبقى كحلية بنص أبيض في الوضعين
- اللوحتان (المكتب والإدارة) تبقيان بثيمهما الفضي الفاتح الثابت

محرَّكة بالإعدادات: كل ما يلي يستجيب لكائن settings القادم مع /api/public/home
(مخزَّن في Zustand عبر src/components/club/site-store.ts):
- نصوص Hero و«عن النادي» حسب اللغة (عربي/فرنسي/إنجليزي) مع الرجوع للقيم الافتراضية
- **عناوين ترويسات الأقسام التسعة** (شارة/عنوان/جزء ملوّن/وصف) بثلاث لغات عبر
  SettingsSectionHeader و useSectionTexts — والقسم «انضم إلنا» صار «إنضم إلى عائلة النادي»
- **خلفية الواجهة**: settings.design.heroImage (4 خلفيات جاهزة بألوان النادي وتجمع كل
  الرياضات + رابط مخصص) والافتراضي /images/hero-all-sports.jpg
- اللون المميز: applyAccent يضبط --silver و--accent-light/deep/deep2 من 5 لوحات
  (فضي معدني، ذهبي فاخر، أحمر جزائري، أخضر جزائري، وردي ملكي)
- إظهار/إخفاء: شريط الإحصائيات، العلامة المائية، قتامة تعتيم Hero (35–90%)،
  **وكل الأقسام العشرة** (عن النادي/الفروع/الأخبار/المباريات/الإنجازات/المعرض/
  الفيديوهات/المتجر/الانضمام/التواصل)
- **الفروع المخفية بأمر الإدارة تختفي تلقائياً من كل الأقسام** (فلترة على مستوى API)
- اللغات المتاحة: مبدّل اللغة يدوّر بين المفعّلة فقط (العربية دائماً)

1. شاشة تحميل أنيقة: الخلفية الكحلية club-gradient + الدرع الرسمي الشفاف متوهجاً
   بهالة فضية + دوران تحميل فضي + عبارة «قوة في الوحدة.. تميز في الأداء»
2. شريط تنقل ثابت زجاجي: الدرع داخل دائرة بحلقة فضية + روابط تمرير سلس
   + زر «دخول المكاتب» + زر لغة يدوّر AR→FR→EN (يظهر اسم اللغة التالية)
   + زر الوضع الليلي/النهاري (شمس ليلاً / قمر نهاراً)
   + عند جلسة مكتب: شارة اسم الفرع + زر «مكتبي» + خروج
   + عند جلسة إدارة: شارة «الإدارة العامة» فضية + زر «لوحة الإدارة» + خروج
3. Hero: **خلفية رياضية احترافية تجمع كل الرياضات بألوان النادي الكحلية/الفضية**
   (قابلة للتغيير من إعدادات الإدارة: 4 خلفيات جاهزة أو رابط مخصص) + الدرع الكامل
   logo-full.png بهالة فضية وعوامة
   + علامة مائية للختم الكامل بشفافية 5% + شارة «تأسس سنة 2024 — بلدية سعيدة»
   + عنوان ضخم أبيض باسم النادي وكلمة «الرائد» بتدرج معدني silver-text
   + إحصائيات بعدادات متحركة في بطاقات زجاجية بأيقونات فضية
   + زران: «إنضم إلى عائلة الرائد» رئيسي بتدرج الأحمر الجزائري وظل ملون (زر العائلة) + «اكتشف فروعنا» زجاجي محدد
4. عن النادي: بطاقة تعريف + القيم داخل مربعات club-gradient بأيقونات فضية
   + كلمة الرئيس داخل لوح كحلي كبير باطار جانبي أحمر جزائري
5. الفروع: شبكة بطاقات ملونة (12 فرعاً) + نافذة تفاصيل بثمانية تبويبات:
   نظرة عامة / الأخبار / اللاعبون / المباريات / جدول الترتيب (رأس جدول كحلي،
   صف النادي بخلفية كحلية فاتحة وشارة «نادينا»، يظهر فقط عند وجود بيانات) /
   التدريبات / الفيديوهات / الصور + زر «دخول مكتب هذا الفرع» في رأس النافذة
6. الأخبار: بطاقات بيضاء بصورة وعنوان كحلي + شارة «مميز ★» فضية + تاريخ
7. المباريات: قسم كحلي club-gradient — مباراة الأسبوع بعدّاد تنازلي حي زجاجي
   + تبويبا «قادمة/نتائج» بقوائم قابلة للتمرير (قسم قابل للإخفاء من الإعدادات)
8. الإنجازات: خط زمني بنقاط كحلية وسنوات بشارات كحلية على فاتح (قابل للإخفاء)
9. المعرض: تبويبان «الصور | الفيديوهات» — صور Masonry + Lightbox،
   وفيديوهات mp4 عبر <video> ويوتيوب عبر iframe embed داخل نافذة تشغيل
   وزر تشغيل دائري فضي (قابل للإخفاء مع تبويب الفيديوهات)
10. متجر النادي id="shop": شبكة منتجات aspect-square + شارة فئة فضية
    + سعر ضخم بالأحمر الجزائري + حوار طلب (الاسم، الهاتف، المقاس للملابس فقط، ملاحظة)
    وزر طلب كحلي → toast نجاح (قسم قابل للإخفاء)
11. إنضم إلى عائلة النادي ⭐ — استمارة طلب الانخراط النهاري الاحترافية (عناوين القسم
    من الإعدادات، والفروع المخفية لا تظهر في بطاقات الاختيار):
    - ترويسة الاستمارة: العنوان + شارة الموسم الحمراء (يضبطه الإدارة من الإعدادات، افتراضياً 2026/2027)
    - بطاقات اختيار الفرع: شبكة قابلة للتمرير، كل بطاقة أيقونة الفرع بلونه + اسمه الكامل
      + رمزه اللاتيني (FOOT-RCS، BASKET-RCS...) + علامة صح عند التحديد وتكبير خفيف —
      الطلب يُرسل حصراً إلى مكتب الفرع المحدد
    - لوحة «الفرع المحدد» الجانبية تعرض الفرع المختار حياً
    - الحقول: الاسم الشخصي* واللقب*، الجنس* (زرّا ذكر/أنثى)، تاريخ الميلاد*
      مع شارة العمر المحسوب تلقائياً، رقم بطاقة التعريف/الولوج، رقم الهاتف*،
      اسم ولي الأمر (إلزامي تحقّقاً للأقل من 18)، ملاحظات
    - زر إرسال ضخم بتدرج أحمر «تأكيد وإرسال طلب الانخراط النهاري»
    - حالة النجاح تعرض «أُرسل طلبك إلى — اسم الفرع» + بطاقة تتبع الطلب زجاجية
      (هاتف → نتائج بشارة الفرع بلونه وشارة الحالة: معلق أصفر/مقبول أخضر/مرفوض أحمر)
12. تواصل: بطاقات معلومات من الإعدادات (العنوان/الهاتف/البريد) بأيقونات داخل
    مربعات كحلية + نموذج رسالة
13. تذييل لاصق كحلي: الدرع + نبذة + روابط الفروع + معلومات التواصل من الإعدادات + حقوق
14. زر عائم فضي «إنضم إلى عائلة النادي» بنص كحلي يظهر دائماً فوق كل الأقسام (مترجم حسب اللغة)

ثلاث لغات: src/components/club/i18n.ts — مخزن zustand بمفتاح raed-lang مع persist
وskipHydration (أول رسم عربي ثم تطبيق المحفوظ والاتجاه rtl/ltr — بلا hydration mismatch)،
قاموس ~140 مفتاحاً لكل من العربية والفرنسية والإنجليزية وhook useT. تُترجم: الشريط، Hero،
عناوين الأقسام، التذييل، نافذة الدخول، المتجر، المعرض، تتبع الطلب، مفاتيح الثيم (theme.light/dark)
ونصوص استمارة الانخراط كاملة — واللوحتان تبقيان عربيتين بالكامل.

PWA: public/manifest.webmanifest (اسم قصير، start_url، standalone، dir rtl، lang ar،
أيقونات 192+512 من الشعار الرسمي الكامل + أيقونة maskable بخلفية كحلية #0f1b3a،
background_color وtheme_color كحليان) + public/sw.js (كاش-first للأصول الثابتة فقط:
/images/ و/videos/ — لا يتدخل مع /api أو الصفحات، واسم الكاش raed-static-v4)
+ src/components/club/pwa-register.tsx لتسجيل صامت وإعادة ترطيب اللغة،
يُدرج في layout.tsx مع metadata.manifest وviewport.themeColor "#0f1b3a"
وأيقونة apple-touch بخلفية كحلية.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡 لوحة مكتب الفرع (view=office — 12 قسماً)
━━━━━━━━━━━━━━━━━━━━━━━━━━
رأس ثابت: شعار الفرع الملون + اسمه + زر عودة + خروج — كله بتدرج كحلي وتمييز فضي
1.  نظرة عامة: بطاقات إحصائية (أعضاء الفرع، وثائق واردة، لاعبون، مباريات،
    طلبات معلقة، تدريبات، صور، ترتيب)
2.  أعضاء الفرع ⭐ (إدارة كاملة من المكتب): بطاقات مرتبة هرمياً — الاسم واللقب، المنصب بشارة
    ملونة حسب الرتبة (رئيس الفرع كحلي صلب، نائب الرئيس كحلي فاتح، المدير التقني أحمر،
    الأمين العام أخضر)، تاريخ الميلاد، التخصص، الهاتف، تاريخ التعيين، ملاحظات
    + بحث وفلترة بالمنصب
    + زر «إضافة عضو» وحوار كامل (المنصب من القائمة الهرمية الثمانية) — والتعديل والحذف
      (بتأكيد) على كل بطاقة عند التحويم — مثال: تصحيح معلومات عضو أو حذفه عند تغيّره
    نفس الترتيب الهرمي التلقائي حسب المنصب الذي في لوحة الإدارة
3.  كتب الإدارة: الوثائق الواردة من الإدارة العامة لهذا الفرع (الموزَّعة أو العامة لكل
    الفروع بشارة خاصة) — رقم مرجع، نوع، إطار معني، تاريخ — وفتح الورقة الرسمية
    وطباعتها (window.print مع CSS طباعة يطبع الورقة وحدها)
4.  الأخبار: CRUD كامل + خيار «مميز»
5.  اللاعبون: CRUD كامل (اسم، رقم، مركز، عمر)
6.  المباريات: إنشاء + إدخال النتيجة وتحويلها إلى «انتهت»
7.  جدول الترتيب: CRUD صفوف والنقاط تُحسب تلقائياً — تظهر في نافذة الفرع العامة
8.  الجدول التدريبي: CRUD حصص أسبوعية
9.  طلبات الانضمام ⭐: عرض كامل الحقول الجديدة (الاسم واللقب، شارة الجنس، تاريخ الميلاد
    والعمر، رقم البطاقة، ولي الأمر) + قبول/رفض فوري + **حذف** الطلبات الخاطئة بتأكيد
    + سجل المقبولين والمرفوضين
10. معرض الصور: إضافة برابط + تعليق + **تعديل** الوصف/الرابط + حذف + صور جاهزة للاختيار
11. الفيديوهات: إضافة (عنوان، رابط mp4 أو يوتيوب، صورة مصغرة) + تعديل + حذف
12. إعدادات الفرع: تعديل motto والوصف واللون
⚠️ القاعدة الذهبية: التعديل والحذف متوفران في كل قسم وكل عنصر من حساب الفرع.
قوائم طويلة داخل max-h-96 overflow-y-auto بشريط تمرير مخصص.
كل عملية تنجح بإشعار Toast عربي، وكل فشل برسالة خطأ واضحة.

━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 لوحة الإدارة المركزية (view=admin — لمدير النادي العام — 9 أقسام)
━━━━━━━━━━━━━━━━━━━━━━━━━━
نفس جمالية لوحة المكتب (رأس club-gradient كحلي بالدرع الرسمي، عودة، خروج،
قائمة جانبية بشارات عدّاد المعلق). تسعة أقسام:
1. نظرة عامة: بطاقات إحصائية (فروع، إطارات معيَّنة، وثائق كتب النادي، لاعبون،
   طلبات معلقة، رسائل، طلبات متجر معلقة)
2. الفروع: بطاقات بأيقونة/لون/عدادات/اسم حساب المكتب
   + **مفتاح إظهار/إخفاء لكل فرع** (Switch + Eye/EyeOff + شارة «مخفي» وبطاقة رمادية عند الإخفاء)
     بضغطة واحدة — ينعكس فوراً على الصفحة الرئيسية في كل الأماكن (الفروع، الأخبار،
     المباريات، الإنجازات، المعرض، استمارة الانضمام، التذييل، صفحة الفرع 404، الإحصائيات)
     ويبقى مكتب الفرع نفسه واللوحة تصلان إليه دائماً
   + حوار إنشاء/تعديل فرع (اسم، slug تلقائي، شعار نصي، وصف، لوحة ألوان جاهزة، 13 أيقونة، صورة،
     **مفتاح «إظهار الفرع في الموقع»** مع شرح نطاق الإخفاء)
   + حوار إنشاء/تحديث حساب المكتب (username + password ≥ 6) + حذف بتأكيد
3. كتب النادي ⭐: السجل الرسمي لكل ملفات النادي ومحاضر التنصيب والمراسلات والطلبات
   وتصاميم الأوراق:
   - رأس بإحصائيات النوع (ملف/محضر/مراسلة/طلب/ورقة رسمية) + فلاتر (بحث، نوع، فرع)
   - قائمة وثائق: رقم المرجع، عنوان، شارة نوع ملونة، تصنيف، فرع/عامة، إطار معني،
     تاريخ، شارة حالة (معروضة في الفرع / مؤرشفة)
   - أمر الإدارة بضغطة: إظهار في حساب الفرع / إخفاء (أو إرسال إلى الفرع)
   - حوار تسجيل/تعديل بتبويبين:
     أ) بيانات الوثيقة: رقم مرجع مقترح تلقائياً CRS/السنة/رقم، عنوان، نوع، تصنيف،
        فرع معني (أو عامة لجميع الفروع)، إطار معني (مفلتر حسب الفرع)، نص يحفظ الأسطر،
        مفتاح «إظهار في حساب الفرع»
     ب) مصمم الورقة ⭐: نمط (رسمي/مبسط/احتفالي)، لون الإطار والختم (كحلي/فضي/أحمر/
        أخضر/ذهبي)، اسم الموقّع، مفاتيح شعار الترويسة والختم الرسمي والعلامة المائية —
        مع معاينة حية للورقة بجوار الخيارات
   - مكون DocumentPaper مشترك يرسم الورقة الرسمية: إطار مزدوج بلون مختار،
     ترويسة (شعار + اسم النادي عربي/فرنسي + الإدارة العامة | الرقم والتاريخ والنيابة)،
     شارة نوع، عنوان مسطّر، المعني، النص، ختم دائري بنجمة، خط توقيع، علامة مائية —
     وقابلة للطباعة عبر فئة doc-print-area
4. إطارات الفروع ⭐: كل الإطارات المعيَّنين على مستوى الفروع (72 إطاراً) —
   - فلاتر: بحث بالاسم/التخصص، فرع، منصب + زر «إطار جديد»
   - بطاقات: أحرف أولى بلون الفرع، الاسم واللقب، شارة المنصب حسب الرتبة، التخصص،
     تاريخ الميلاد، الهاتف، عدد ملفاته في كتب النادي
   - حوار تعيين/تعديل: الفرع، المنصب (قائمة هرمية)، الاسم، اللقب، تاريخ الميلاد،
     تاريخ التعيين، التخصص، الهاتف، ملاحظات
   - نافذة الملف الشخصي: كل بيانات الإطار + قائمة ملفاته من كتب النادي
5. طلبات الانضمام: فلاتر فرع/حالة + كل الحقول الجديدة (شارة الجنس، تاريخ الميلاد،
   رقم البطاقة، ولي الأمر) + قبول/رفض/حذف
6. الأخبار: تعديل عنوان/محتوى/مميز + حذف + شارات فروع ملونة
7. الرسائل: عرض + حذف
8. المتجر: تبويبان — إدارة منتجات (CRUD + شارة نشط) وطلبات (شارة pending/done + زر «تم التسليم»)
9. إعدادات الموقع ⭐: أربعة تبويبات:
   - الهوية والتصميم: **معرض خلفيات الواجهة** (4 خلفيات جاهزة: كل الرياضات/ملعب الليل/
     زخرفة رياضية/الملعب الكلاسيكي ببطاقات مصغرة وشارة «مفعّلة» + رابط صورة مخصص
     + **معاينة حية للخلفية فوقها نص تجريبي**) + 5 لوحات ألوان مميزة (تُطبَّق حياً على كامل
     الواجهة أثناء التعديل)، مفتاحا شريط الإحصائيات والعلامة المائية، شريط قتامة تعتيم Hero،
     **حقل موسم الانخراط** الذي يظهر في شارة استمارة الانخراط بالواجهة
   - نصوص الواجهة والأقسام: تبويبات لغة (العربية/Français/English) لحقول Hero الخمسة
     وعنوان «عن النادي» + **محرر عناوين 9 أقسام** (منتقي أقسام: عن النادي، فروعنا الرياضية،
     أخبار النادي، المباريات والنتائج، الإنجازات، معرض الصور، متجر النادي، إنضم إلى عائلة
     النادي، تواصل معنا) لكل قسم 4 حقول (الشارة العلوية/العنوان الرئيسي/الجزء الملوّن
     للانضمام/الوصف) بثلاث لغات — الحقل الفارغ يعود للنص الافتراضي
   - معلومات التواصل: العنوان/الهاتف/البريد/فيسبوك/إنستغرام/يوتيوب — تظهر في قسم
     التواصل والتذييل
   - الأقسام واللغات: **مفاتيح إظهار/إخفاء 10 أقسام** (عن النادي، الفروع، الأخبار، المباريات،
     الإنجازات، المعرض، الفيديوهات داخل المعرض، المتجر، الانضمام، التواصل) بعين
     Eye/EyeOff + مفاتيح اللغات المتاحة للزوار (العربية ثابتة)
   - زر «حفظ الإعدادات ونشرها» → /api/admin/settings + تحديث المخزن فوراً
كل العمليات على /api/admin/* ثم reload، وأي عملية 401 تعيد المستخدم للدخول برسالة.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🌱 بيانات أولية (Seed) — أنشئ scripts/seed.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━
12 فرعاً بألوان وأيقونات وصور وشعارات نصية:
1.  كرة القدم football #16a34a «قلب النادي النابض»
2.  كرة السلة basketball #ea580c «السرعة والدقة»
3.  كرة اليد handball #dc2626 «قوة الجماعة»
4.  الكرة الطائرة volleyball #d946ef «نحو القمة»
5.  ألعاب القوى athletics #f59e0b «أسرع.. أعلى.. أقوى»
6.  الفنون القتالية martial-arts #7c3aed «روح الساموراي»
7.  السباحة swimming #0d9488 «سيولة وانسيابية»
8.  تنس الطاولة table-tennis #65a30d «ردود الفعل الخاطفة»
9.  الشطرنج chess #0e7490 «عقول تتصدر»
10. الدراجات cycling #ca8a04 «قوة الدوس»
11. الجمباز gymnastics #db2777 «بهاء الحركة»
12. الملاكمة boxing #92400e «قبضة حديدية»
(هذه ألوان هوية الفروع الداخلية فوق الهوية الكحلية-الفضية العامة للنادي)

+ حساب الإدارة: admin / admin123
+ حساب مكتب لكل فرع: اسم المستخدم = slug الفرع، كلمة المرور للجميع 123456
+ 72 إطاراً (6 لكل فرع بالمناصب الهرمية الستة: رئيس، نائب رئيس، أمين عام،
  مدير تقني، نائب مدير تقني، مدرب) بأسماء جزائرية وتواريخ ميلاد وتخصصات
+ 6 وثائق في كتب النادي: محضر تنصيب مكتب فرع كرة القدم (معروض)، قرار تعيين
  المدير التقني (معروض)، مراسلة عامة لجميع الفروع (معروضة)، ملف إداري مؤرشف،
  شهادة شكر وتقدير بنوع design وdesign JSON، طلب معدات مؤرشف
+ إعدادات الموقع الافتراضية: نصوص Hero بثلاث لغات، معلومات تواصل،
  accent=فضي، كل الأقسام ظاهرة، اللغات الثلاث مفعلة
+ 15 خبراً واقعياً بالعربية + 53 لاعباً بأسماء جزائرية + 9 مباريات (5 قادمة/4 منتهية)
+ جداول ترتيب لفروع football وbasketball وhandball (4–6 فرق لكل جدول، النادي بينها)
+ 6 منتجات متجر بأسماء وأسعار جزائرية + طلبان تجريبيان
+ فيديوهان (public/videos/club-tour.mp4 و training.mp4)
+ 17 حصة تدريبية + 8 إنجازات + 8 صور معرض + 3 طلبات انضمام معلقة

━━━━━━━━━━━━━━━━━━━━━━━━━━
🖼 الأصول (الصور والفيديو)
━━━━━━━━━━━━━━━━━━━━━━━━━━
- الشعار الرسمي: أستلمه من إدارة النادي كملف PNG شفاف (درع كحلي بإطار فضي
  وحرفي CRS وصقر أسود ونجوم فضية وغار — أبعاده أعرض من طوله لكن محتواه عمودي)،
  أقصّه إلى حدود المحتوى الفعلية (alpha bbox) ثم أنتج: logo-full.png (الدرع الكامل
  العمودي) + logo.png (مربع محتوي بلا أي قص) + logo-wide.png + أيقونات PWA —
  ⚠️ ممنوع القص المركزي من الجانبين — وإن لم أستلم الشعار أُعيد بناءه بالذكاء
  الاصطناعي بنفس الوصف الدقيق أعلاه
- hero.jpg: لقطة سينمائية لملعب ليلي بتدرج كحلي وأضواء كاشفة بيضاء
- 12 صورة فروع + 6 صور منتجات (توليد AI)
- 5 صور معرض + فيديوهان mp4 (جولة في النادي + تدريب)

━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ معايير القبول (تحقق منها في المتصفح قبل التسليم)
━━━━━━━━━━━━━━━━━━━━━━━━━━
- الصفحة تحمّل بلا أخطاء في الكونسول أو سجل الخادم
- ⚠️ الشعار الرسمي يظهر **كاملاً بأغصان الغار دون أي قص من الجانبين** في Hero
  والشريط والتذييل وشاشة التحميل وأيقونة الموقع وPWA
- الهوية كحلية/فضية بالكامل: لا ذهبي ولا أخضر قديم ولا أزرق افتراضي في أي قسم
- تسجيل الدخول يعمل لحساب الإدارة وحسابات المكاتب الاثني عشر
- ⚠️ الدخول يعمل حتى داخل iframe/لوحة معاينة (بفضل Bearer Token) والجلسة تبقى بعد تحديث الصفحة
- خبر أنشئ من المكتب يظهر فوراً في الموقع العام
- صف ترتيب يُضاف من المكتب يظهر في نافذة الفرع بترتيب النقاط
- طلب انضمام مُرسل من النموذج يظهر في مكتب الفرع ولوحة الإدارة ويُقبل/يُرفض/يُحذف،
  ويمكن تتبعه برقم الهاتف من الموقع العام
- طلب متجر يُسجل ويظهر في لوحة الإدارة وتتحول حالته «تم التسليم»
- ⚠️ تسجيل وثيقة من «كتب النادي» بمصمم الورقة + معاينة حية + طباعة يعمل
- ⚠️ الوثيقة المفعلة بـ «إظهار في الفرع» تظهر فوراً في تبويب «كتب الإدارة» بحساب ذلك الفرع،
  والعامة (بلا فرع) تظهر في كل الفروع
- ⚠️ تعيين إطار في فرع من «إطارات الفروع» يظهر فوراً في تبويب «أعضاء الفرع»
  بحساب الفرع مرتباً هرمياً بالمنصب (الاسم واللقب وتاريخ الميلاد والمنصب)
- ⚠️ تغيير اللون المميز من «إعدادات الموقع» وتغيير نص Hero بالفرنسية/الإنجليزية
  ينعكس فوراً على الواجهة الرئيسية للزوار بعد الحفظ
- ⚠️ مبدّل اللغة يدوّر بين العربية والفرنسية والإنجليزية ويقلب الاتجاه rtl↔ltr دون أخطاء ترطيب
- ⚠️ زر الوضع الليلي/النهاري يقلب كامل الواجهة (الليلي افتراضياً)، يُحفظ الاختيار ويبقى
  بعد تحديث الصفحة بلا وميض، وكل الأقسام مقروءة في الوضعين — والنص المعدني يبقى متدرجاً (لا صندوقاً)
- ⚠️ استمارة الانخراط: اختيار الفرع ببطاقات، كل الحقول، ولي الأمر إلزامي للأقل من 18،
  والعمر يُحتسب تلقائياً، والطلب يصل حصراً إلى مكتب الفرع المحدد مع كل بياناته
- ⚠️ التعديل والحذف يعملان في كل صفحة من حساب الفرع (أعضاء الفرع مثالاً: إضافة،
  تعديل معلومات، حذف عضو بتأكيد) وحذف طلبات الانضمام الخاطئة، وفي كل أقسام الإدارة
- حساب فرع لا يرى أبداً بيانات فرع آخر، ولا يصل للإدارة، والعكس صحيح (اختبرها — 401)
- إنشاء فرع جديد من لوحة الإدارة مع حسابه ثم الدخول به يعمل
- التطبيق يُثبَّت كـ PWA ويخدم الصفحات دون اتصال للأصول الثابتة
- التجاوب مثالي على 390px والشاشات الكبيرة، والتذييل لاصق دائماً
- lint نظيف وصفر أخطاء TypeScript
```

---

## 🌍 نسخة إنجليزية مختصرة (لأدوات لا تفهم العربية جيداً)

```text
Build a full-stack, world-class trilingual (Arabic RTL / French / English) website with FULL DARK/LIGHT MODE for "Al-Raed Multi-Sports Club — Saïda Municipality, Algeria" (French: Club Sportif Amateur Omnisports Rayed — APC de Saïda, EST. 2024) with FOUR layers: public site, per-branch private offices (12 branches), a central club-manager admin panel, and a professional seasonal enrollment flow that sends each request directly to the branch chosen in the form.

Stack (mandatory): Next.js 16 App Router + TypeScript + Tailwind CSS 4 + shadcn/ui + Lucide + Prisma/SQLite (import { db } from '@/lib/db') + API Routes only + Framer Motion + Zustand (language + site-settings state).

OFFICIAL BRAND (from the club's real crest — apply strictly): navy shield with silver metallic border, black falcon forming letter R between green C and red S, five silver stars, silver ribbons "CLUB SPORTIF AMATEUR OMNISPORTS RAYED / APC DE SAÏDA", silver laurel wreaths, "EST. 2024" plate. The crest is PORTRAIT (~0.85) — NEVER center-crop it to a square. Palette: deep navy #0f1b3a (dark bg, PWA theme), primary navy #1d2f5e (buttons/headings on light), metallic silver #d6dce8 (accent on dark — replaces gold), Algerian red #d21034, Algerian green #006233. Silver ONLY on dark; on light use navy + red. No gold, no default Tailwind blue/indigo. Cairo font 400–900, rounded-2xl, responsive 360px→4K, sticky footer, aria labels. Process the transparent crest PNG into logo-full.png (complete portrait emblem 1000px), logo.png (square 1200 CONTAIN with transparent padding), logo-wide.png (watermark), PWA icons 192/512 + maskable (navy bg) + apple-touch 180.

Data model (18 Prisma models): Branch(slug, name, motto, icon, color, image, visible=true — admin can SHOW/HIDE any branch from the whole site), Admin(username unique), BranchAccount(1-to-1 Branch), BranchMember(firstName, lastName, birthDate, hierarchical position, specialty, phone, appointedAt, auto sortOrder), ClubDocument(refNumber, title, type file|minute|letter|request|design, category, content, design JSON, memberId?, branchId? (null = for all branches), visibleToBranch), SiteSetting(key "site", JSON value incl. design.season + design.heroImage + section header texts), News, Player, Match, Training, Enrollment(firstName, lastName, fullName, gender male|female, birthDate, computed age, address, phone, parentName (required under 18), note, pending/accepted/rejected, branchId), GalleryItem, Achievement, ContactMessage, Standing(auto points), VideoItem, Product, ShopOrder.

Auth (CRITICAL — dual delivery): scrypt salt:hash + timingSafeEqual; HMAC-SHA256 signed token payload { role:'office'|'admin', accountId, branchId?, iat, exp } valid 24h, signed with AUTH_SECRET from .env (fail-closed, no default secret); tokenInvalidBefore field revokes all sessions on password change; rate limiting (login lockout 5 fails/10min + IP caps, public forms 8/10min, status query needs phone+lastName); security headers (nosniff/Referrer-Policy/Permissions-Policy/HSTS); SecurityEvent audit log shown in admin 'Security' tab; pentest suite scripts/pentest.ts (34 tests, 33 passing — 1 is the user action: change default admin123). Login returns token in JSON body; client stores in localStorage (raed-session-token), sends Authorization: Bearer via apiFetch helper (src/lib/session.ts); httpOnly cookie fallback. Helpers read header FIRST then cookie — required because preview iframes block cookies. Strict role isolation; office queries scoped by session branchId. zod with Arabic error messages.

Public site (single page.tsx, view home|office|admin) — DUAL THEME (dark default = navy identity): theme store (zustand persist key raed-theme) + inline no-flash script applying `light` class on <html> + meta theme-color; central token --paper (mapped via @theme inline --color-paper) used as text-paper / bg-paper/10 / border-paper/15 across public components; under html.light override .club-gradient (light silver gradient), .glass, .dark-hero-overlay, .subtle-pattern, .silver-text (deepen gradient — use background-image, never the background shorthand, or background-clip:text resets), lighter shadows; permanently-navy surfaces (footer, standings header, colored badges) stay navy with white text; toggle button (sun/moon) in navbar + mobile menu, choice persists across reloads. — ALSO DRIVEN BY ADMIN SETTINGS (site-store.ts): hero/about texts per language, SECTION HEADER OVERRIDES for all 9 sections (eyebrow/title/titleGold/subtitle ×3 languages via SettingsSectionHeader + useSectionTexts — join section reads "إنضم إلى عائلة النادي"), HERO BACKGROUND IMAGE (design.heroImage: 4 AI-generated all-sports navy/silver presets + custom URL, default /images/hero-all-sports.jpg), accent color (5 presets applied live via CSS vars), stats-strip/watermark toggles, hero overlay opacity, section visibility for ALL 10 sections (about/branches/news/matches/achievements/gallery/videos/shop/join/contact), enabled languages; HIDDEN BRANCHES (Branch.visible=false) vanish from every public list via API-level filtering (branches grid, news+filters, matches, achievements, gallery, videos, join form branch cards, footer, stats counts) and /api/public/branch returns 404 for them — while their office and the admin panel keep full access. Glass navbar with coin crest + cycling language button (AR→FR→EN, shows next language) + theme toggle, hero (AI all-sports background, FULL crest with laurels, silver glow + float + 5% watermark, metallic gradient name, RED gradient primary CTA "join the family" + glass secondary), about, 12-branch grid with 8-tab detail dialog (incl. standings with highlighted club row), news, matches with live countdown, achievements timeline, gallery tabs (masonry+lightbox | mp4/YouTube), shop with red prices + order dialog, PROFESSIONAL SEASONAL ENROLLMENT FORM (season badge from settings, scrollable branch-card grid with icon+full name+latin code FOOT-RCS & check state + live "selected branch" panel, first/last name (placeholder examples like «مثال: علاء الدين»), gender segmented buttons, birthdate with auto-computed age chip + DD/MM/YYYY display (SITE-WIDE unified day/month/year format via shared formatDateDMY util in src/lib/date-format.ts — applied to news, matches, enrollments, members, documents, papers — NO ID-card / national-number fields anywhere), age-conditional section: minor → amber guardian fieldset (full name + address + phone), adult → green personal fieldset (address + phone), notes, big red-gradient submit; success shows "sent to — branch name"; phone tracking card), contact (info from settings), floating join button, sticky navy footer. i18n: zustand persist + skipHydration, ~140 keys × 3 languages (incl. theme + full form; join/nav corrected to "إنضم إلى عائلة النادي"), dashboards stay Arabic. PWA: manifest (navy) + sw.js cache-first static (raed-static-v4) + register component.

Branch Office (12 sections, EDIT/DELETE EVERYWHERE): overview stats, BRANCH MEMBERS with FULL CRUD (add button + dialog with hierarchical position select, edit/delete on hover per card with Arabic confirm — fix a member's info or remove them on change/error; same auto hierarchical order as admin), ADMIN DOCUMENTS RECEIVED (docs assigned or general, open official paper + print), news CRUD, players CRUD, matches+scores, standings CRUD (auto points), trainings CRUD, enrollments (full new fields display: gender badge, birthdate+age DD/MM/YYYY, guardian box for minors; accept/reject AND delete wrong ones), gallery add+EDIT caption/url+delete, videos add/edit/delete, settings.

Admin Central Panel (9 sections): overview stats; branches manager (+ office account upsert + SHOW/HIDE SWITCH per branch card with "مخفي" badge and grey card, also inside the create/edit dialog with scope explanation — one click syncs the whole public site instantly); CLUB RECORDS "كتب النادي" — registry of all files/installation minutes/correspondences/requests/paper designs with search+type+branch filters, one-click show/hide-to-branch command, and a DOCUMENT DESIGNER dialog (2 tabs: data fields with auto ref number CRS/YEAR/NNN, member picker, general-to-all-branches option | design tab: style official/minimal/ceremonial, frame+stamp color, signature name, logo/stamp/watermark toggles, LIVE paper preview); shared DocumentPaper component (double frame, header with crest + bilingual club name + ref/date, type badge, underlined title, member line, content, round stamp with star, signature line, watermark, printable via doc-print-area CSS); BRANCH MEMBERS MANAGER (72 staff across branches, filters, hierarchical position select, auto sortOrder, member profile dialog with their documents); enrollments (full new fields: gender/birthdate/guardian + accept/reject/delete); news; messages; shop; SITE SETTINGS (design tab with HERO BACKGROUND GALLERY (4 preset thumbnails with active badge + custom URL input + LIVE preview over the overlay opacity) + 5 accent swatches + toggles + overlay slider + ENROLLMENT SEASON input | texts tab with per-language hero fields + SECTION HEADERS EDITOR (9-section picker × eyebrow/title/titleGold-for-join/subtitle × 3 languages, empty = fallback) | contact info | layout tab with ALL 10 section show/hide switches (Eye/EyeOff) + language switches) saved via /api/admin/settings and applied instantly.

APIs (21): public home(+settings)/branch/enroll(full form fields + age computed + guardian required under 18)/contact/order/enroll-status; auth login(token+cookie)/logout/me; office data(+members+documents)/items(+member type)/enrollments(PATCH status + DELETE); admin data(+members+documents+settings)/branches/accounts/items/members/documents/settings(GET+POST). Protected routes 401 without valid session; office ops always scoped by session branchId.

Seed: 12 branches (football #16a34a … boxing #92400e), admin/admin123, office accounts (username=slug, password 123456), 72 branch members (6 per branch in 6 hierarchical roles, Algerian names), 6 club documents (installation minute, appointment decision, general circular, archived file, thank-you certificate of type design with JSON, equipment request), default site settings (trilingual hero texts, contact info, silver accent, all sections on, 3 languages), 15 Arabic news, 53 players, 9 matches, standings for 3 branches, 6 products, 2 AI mp4 videos, trainings, achievements, gallery, 3 pending enrollments.

Acceptance: zero console/server errors; FULL crest visible with laurels — never cropped at sides — in hero/navbar/footer/loading/favicon/PWA; fully navy/silver identity; DARK/LIGHT toggle flips the whole public site (dark default), persists across reload without flash, metallic gradient text stays gradient (never a filled box); hero background is a professional ALL-SPORTS AI image switchable from admin (4 presets + custom URL + live preview); toggling a branch's visibility in admin instantly removes/returns it everywhere on the public site (grid, news filters, join form, footer, stats, branch page 404) while its office stays accessible; join/nav texts read "إنضم إلى عائلة النادي" and every section header is admin-editable in 3 languages with live fallback; enrollment form: branch cards, all fields, guardian required under 18, computed age, request lands ONLY in the selected branch office with every field; EDIT/DELETE works on every page of branch accounts (branch members: add, edit info, delete with confirm; delete wrong enrollments) and every admin section; login works for admin + 12 offices INCLUDING inside iframe previews (Bearer); session survives refresh; office-created content appears instantly; document registered via designer with live preview + printable; document toggled "show in branch" appears in that branch office tab (general docs appear in all branches); member appointed in admin appears in branch members tab hierarchically; accent change + hero background change + FR/EN hero text edit + section header edits reflect on public site after save; hiding a whole section (e.g. news) removes its anchor from the page; language button cycles 3 languages flipping dir without hydration errors; full tenant isolation (401 both ways); installable PWA; perfect 390px layout; sticky footer; clean lint + zero TS errors.
```

---

## 📌 ملاحظات الاستخدام

1. **للأدوات البرمجية (Cursor / Claude Code / Z.ai):** انسخ البرومت العربي الطويل كاملاً — سيبني كل شيء خطوة بخطوة.
2. **لأدوات توليد الواجهات (v0 / Lovable):** استخدم النسخة الإنجليزية المختصرة أولاً، ثم ألحق البرومت العربي للتفاصيل.
3. **أهم أربع نقاط لا تُحذف أبداً:**
   - نظام المصادقة المزدوج (Bearer + Cookie) — بدونه سيفشل تسجيل الدخول داخل لوحات المعاينة وiframe.
   - الشعار الرسمي **يُعرض كاملاً بأغصان الغار دون أي قص من الجانبين** (مربع محتوي، لا قص مركزي).
   - الهوية الرسمية كحلي `#0f1b3a` × فضي `#d6dce8` × أحمر `#d21034` — بلا ذهبي ولا أزرق افتراضي.
   - **التعديل والحذف متوفران في كل صفحة** من حسابات الفروع والإدارة — لا يوجد عنصر «للقراءة فقط».
4. **ملف الشعار:** أرفق ملف الشعار الأصلي (PNG شفاف) مع البرومت إن أمكن؛ وإلا فسيعيد الذكاء الاصطناعي بناءه بالوصف الدقيق المذكور.
5. **الحسابات التجريبية:** الإدارة `admin / admin123` — المكاتب `football` أو `chess` أو أي slug فرع / `123456`.

---

## 🕒 سجل التحديثات

- **v6.0 (النسخة الحالية والنهائية):** أربعة تحسينات كبرى بناء على طلب إدارة النادي:
  1. **إظهار أو إخفاء أي فرع حسب الاختيار (من الإدارة العامة)** — حقل Branch.visible + مفتاح
     Switch على بطاقة كل فرع (ومفتاح داخل حوار الإنشاء/التعديل) بشارة «مخفي» — متزامن فورياً
     مع الصفحة الرئيسية في كل الأماكن: فروعنا الرياضية، أخبار النادي وفلاتره، المباريات،
     الإنجازات، المعرض، الفيديوهات، استمارة «إنضم إلى عائلة النادي»، التذييل، عدادات
     الإحصائيات، وصفحة الفرع (404) — بينما يبقى مكتب الفرع والإدارة يوصلان إليه دائماً.
  2. **تصحيح الكتابة** — «انضم إلنا» أصبحت **«إنضم إلى عائلة النادي»** في شريط التنقل
     وقسم الانضمام بثلاث لغات (+ همزة القطع في «إنضم إلى عائلة الرائد» بالـ Hero).
  3. **خلفية الواجهة الرئيسية الاحترافية** — 3 صور وُلّدت بالذكاء الاصطناعي بألوان النادي:
     لوحة «كل الرياضات» (كرة القدم، السلة، اليد، السباحة، ألعاب القوى، الكاراتيه، الشطرنج،
     الجمباز) افتراضياً، و«ملعب الليل»، و«زخرفة رياضية» — قابلة للتغيير من الإدارة عبر معرض
     خلفيات بمعاينة حية وشارة «مفعّلة» أو رابط صورة مخصص، مع قتامة تعتيم قابلة للضبط.
  4. **تعديل كل ميزات الصفحة الرئيسية أصبح أسهل** — محرر عناوين 9 أقسام (شارة/عنوان/
     جزء ملوّن/وصف × 3 لغات) عبر SettingsSectionHeader، ومفاتيح إظهار/إخفاء 10 أقسام
     (عن النادي/الفروع/الأخبار/المباريات/الإنجازات/المعرض/الفيديوهات/المتجر/الانضمام/التواصل).
- **v5.0:** الوضع الليلي والنهاري + استمارة الانخراط النهاري الاحترافية المرسلة للفرع المحدد + التعديل والحذف في كل صفحة.
  1. **الوضع الليلي والنهاري في الواجهة الرئيسية** — مبدّل (شمس/قمر) في الشريط وقائمة الجوال،
     الليلي افتراضياً (هوية النادي الكحلية)، حفظ الاختيار وتطبيقه بلا وميض، رمز نصي موحّد --paper
     يقلب ألوان النصوص فوق الأسطح الملوّنة، وتجاوزات CSS مركزية تحت html.light
     (التدرج الكحلي يصير فضياً فاتحاً والنص المعدني يُعمّق) — مع بقاء العناصر الكحلية الصريحة
     والتذييل كحلية بنص أبيض في الوضعين، واللوحتين الداخليتين بثيمهما الثابت.
  2. **استمارة الانخراط النهاري الاحترافية** — شارة موسم يضبطها الإدارة (2026/2027)، بطاقات
     اختيار الفرع بأيقوناتها وألوانها ورموزها اللاتينية (FOOT-RCS...) مع علامة صح، لوحة
     «الفرع المحدد» الحية، الحقول الكاملة (الاسم الشخصي واللقب، الجنس ذكر/أنثى، تاريخ الميلاد
     مع العمر المحسوب تلقائياً، رقم بطاقة التعريف/الولوج، ولي الأمر الإلزامي للأقل من 18،
     الهاتف، ملاحظات)، زر إرسال أحمر ضخم، ونجاح يعرض اسم الفرع — **الطلب يصل حصراً إلى
     مكتب الفرع المحدد في الاستمارة** (نموذج Enrollment موسّع بستة حقول جديدة + تحقق zod)،
     وعرض كامل الحقول في مكتب الفرع ولوحة الإدارة.
  3. **التعديل والحذف في كل صفحة وكل شيء** — حسابات الفروع: أعضاء الفرع صارت قابلة للإضافة
     والتعديل والحذف من المكتب (مثال: تصحيح معلومات عضو أو حذفه عند تغيّره) بنفس الترتيب
     الهرمي، وحذف طلبات الانضمام الخاطئة، وتعديل صور المعرض والفيديوهات؛ ولوحة الإدارة
     تُظهر كل الحقول الجديدة للطلبات مع قبول/رفض/حذف.
- **v4.0:** كتب النادي + مصمم الأوراق، إطارات وأعضاء الفروع، إعدادات وتصميم الواجهة الرئيسية بثلاث لغات، وإصلاح قص الشعار.
- **v3.0:** اعتماد الشعار الرسمي والهوية الكحلية × الفضية مع الأحمر والأخضر الجزائريين.
- **v2.0:** لوحة الإدارة المركزية، 12 فرعاً، جداول الترتيب، الفيديوهات، المتجر، تتبع الطلبات، AR/FR، PWA، والمصادقة المزدوجة.
- **v1.0:** الموقع الأساسي — 8 فروع، مكاتب محمية، 10 مسارات API، 10 جداول.
