import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import crypto from 'crypto'

/**
 * الاتصال: Turso عند توفر TURSO_DATABASE_URL (مثل تعبئة قاعدة الإنتاج الدائمة)،
 * وإلا SQLite المحلي من DATABASE_URL — نفس منطق src/lib/db.ts.
 */
function makeClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  if (tursoUrl) {
    // إصدار @prisma/adapter-libsql ‏6.x يستقبل كائن الإعدادات ويُنشئ العميل داخلياً
    const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN })
    return new PrismaClient({ adapter })
  }
  return new PrismaClient()
}

const db = makeClient()

// ===== تشفير كلمة المرور (نفس منطق lib/auth) =====
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function daysFromNow(days: number, hour = 17): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d
}

async function main() {
  console.log('🌱 بدء تعبئة قاعدة البيانات...')

  // تنظيف
  await db.clubDocument.deleteMany()
  await db.branchMember.deleteMany()
  await db.siteSetting.deleteMany()
  await db.contactMessage.deleteMany()
  await db.shopOrder.deleteMany()
  await db.product.deleteMany()
  await db.videoItem.deleteMany()
  await db.standing.deleteMany()
  await db.admin.deleteMany()
  await db.achievement.deleteMany()
  await db.galleryItem.deleteMany()
  await db.enrollment.deleteMany()
  await db.training.deleteMany()
  await db.match.deleteMany()
  await db.player.deleteMany()
  await db.news.deleteMany()
  await db.branchAccount.deleteMany()
  await db.branch.deleteMany()

  // ============ الفروع ============
  const branchesData = [
    {
      slug: 'football',
      name: 'كرة القدم',
      motto: 'قلب النادي النابض',
      description: 'فرع كرة القدم هو قلب نادي الرائد النابض، يضم فئات سنية متنوعة من الأشبال إلى الكبار، ويشرف عليه طاقم تقني محترف يعمل على اكتشاف المواهب وصقلها لتصل إلى أعلى المستويات الوطنية والقارية.',
      icon: 'Goal',
      color: '#16a34a',
      image: '/images/branches/football.jpg',
      sortOrder: 1,
    },
    {
      slug: 'basketball',
      name: 'كرة السلة',
      motto: 'السرعة والدقة',
      description: 'فرع كرة السلة يضم نخبة من اللاعبين الموهوبين في مختلف الفئات السنية، بقيادة مدربين معتمدين، ويشارك سنوياً في البطولات الوطنية بروح تنافسية عالية.',
      icon: 'Dribbble',
      color: '#ea580c',
      image: '/images/branches/basketball.jpg',
      sortOrder: 2,
    },
    {
      slug: 'handball',
      name: 'كرة اليد',
      motto: 'قوة الجماعة',
      description: 'فرع كرة اليد من أعرق فروع النادي، يحصد مراكز متقدمة في البطولات الجهوية والوطنية، ويوفر بيئة تدريبية احترافية لتنشئة جيل من اللاعبين الأقوياء.',
      icon: 'Hand',
      color: '#dc2626',
      image: '/images/branches/handball.jpg',
      sortOrder: 3,
    },
    {
      slug: 'volleyball',
      name: 'الكرة الطائرة',
      motto: 'نحو القمة',
      description: 'فرع الكرة الطائرة يواكب أحدث الأساليب التدريبية العالمية، ويضم فئات ناشئة وكبار، بخطة عمل واضحة للوصول إلى منصة التتويج الوطنية.',
      icon: 'Volleyball',
      color: '#d946ef',
      image: '/images/branches/volleyball.jpg',
      sortOrder: 4,
    },
    {
      slug: 'athletics',
      name: 'ألعاب القوى',
      motto: 'أسرع.. أعلى.. أقوى',
      description: 'فرع ألعاب القوى هو مدرسة النادي الأولى لاكتشاف الأبطال، يشمل السprints والمسافات المتوسطة والقفز والرمي، ويحقق أرقاماً قياسية على مستوى الولايات الوطنية.',
      icon: 'Timer',
      color: '#f59e0b',
      image: '/images/branches/athletics.jpg',
      sortOrder: 5,
    },
    {
      slug: 'martial-arts',
      name: 'الفنون القتالية',
      motto: 'روح الساموراي',
      description: 'فرع الفنون القتالية يضم الكاراتيه والتايكوندو والجودو، ويعلم قيم الانضباط والاحترام والثقة بالنفس، وقد حصد عشرات الميداليات في البطولات المحلية والدولية.',
      icon: 'Swords',
      color: '#7c3aed',
      image: '/images/branches/martial-arts.jpg',
      sortOrder: 6,
    },
    {
      slug: 'swimming',
      name: 'السباحة',
      motto: 'سيولة وانسيابية',
      description: 'فرع السباحة يوفر تدريباً احترافياً في مسبح أولمبي بإشراف مدربين معتمدين دولياً، مع برامج خاصة لتعليم السباحة للأطفال وتأهيب السباحين للمنافسات الوطنية.',
      icon: 'Waves',
      color: '#0d9488',
      image: '/images/branches/swimming.jpg',
      sortOrder: 7,
    },
    {
      slug: 'table-tennis',
      name: 'تنس الطاولة',
      motto: 'ردود الفعل الخاطفة',
      description: 'فرع تنس الطاولة من الفروع الصاعدة في النادي، يجمع بين المتعة والأداء العالي، وينظم دوريات داخلية منتظمة ويشارك في البطولات الجهوية بنجاحات متواصلة.',
      icon: 'CircleDot',
      color: '#65a30d',
      image: '/images/branches/table-tennis.jpg',
      sortOrder: 8,
    },
    {
      slug: 'chess',
      name: 'الشطرنج',
      motto: 'عقول على رقعة النصر',
      description: 'فرع الشطرنج مدرسة التفكير الاستراتيجي في النادي، ينظم دوريات داخلية ومشاركات متواصلة في البطولات الولائية والوطنية، ويستقبل المبتدئين وذوي الخبرة على حد سواء تحت إشراف مدربين معتمدين.',
      icon: 'Brain',
      color: '#0e7490',
      image: '/images/branches/chess.jpg',
      sortOrder: 9,
    },
    {
      slug: 'cycling',
      name: 'الدراجات',
      motto: 'عجلات الذهب',
      description: 'فرع الدراجات يخوض سباقات الطريق والجبل عبر مسارات سعيدة الجبلية الشهيرة، ويضم نخبة من الدراجين الشباب الطامحين إلى تمثيل الولاية في الحلبات الوطنية.',
      icon: 'Bike',
      color: '#ca8a04',
      image: '/images/branches/cycling.jpg',
      sortOrder: 10,
    },
    {
      slug: 'gymnastics',
      name: 'الجمباز',
      motto: 'رشاقة وفن',
      description: 'فرع الجمباز يكشف المواهب الرشيقة منذ سن مبكرة، ببرامج تكوين متدرجة في الجمباز الفني والإيقاعي، وقد حصد ألقاباً جهوية في منافسات السيدات والرجال.',
      icon: 'PersonStanding',
      color: '#db2777',
      image: '/images/branches/gymnastics.jpg',
      sortOrder: 11,
    },
    {
      slug: 'boxing',
      name: 'الملاكمة',
      motto: 'قبضة حديدية',
      description: 'فرع الملاكمة من الفروع الحاملة لألوان النادي في الحلبات الوطنية، يعلّم فن اللكمة النظيفة وقوة الإرادة، ويضم أبطالاً حصدوا ميداليات في البطولات الولائية والجهوية.',
      icon: 'Flame',
      color: '#92400e',
      image: '/images/branches/boxing.jpg',
      sortOrder: 12,
    },
  ]

  const branches: Record<string, { id: string; name: string; slug: string }> = {}
  for (const b of branchesData) {
    const created = await db.branch.create({ data: b })
    branches[b.slug] = created
    await db.branchAccount.create({
      data: {
        username: b.slug,
        passwordHash: hashPassword('123456'),
        branchId: created.id,
      },
    })
  }
  console.log('✅ 12 فرعاً + حسابات المكاتب')

  // ============ حساب الإدارة المركزية ============
  await db.admin.create({
    data: {
      username: 'admin',
      passwordHash: hashPassword('admin123'),
      name: 'مدير النادي العام',
    },
  })
  console.log('✅ حساب الإدارة المركزية (admin / admin123)')

  // ============ الأخبار ============
  const newsData = [
    {
      branch: 'football',
      title: 'الرائد يحقق فوزاً مثيراً في ختام الجولة الثامنة',
      content: 'حقق فريقنا الأول لكرة القدم فوزاً ثميناً بنتيجة 3-1 على غريمه التقليدي في مباراة أقيمت على الملعب البلدي بسعيدة، وسط حضور جماهيري غفير. سجل الأهداف كل من أمين بوعلام وياسين مرابط وسيف الدين قاسمي، ليرفع الرائد رصيده إلى 21 نقطة في صدارة المجموعة.',
      image: '/images/branches/football.jpg',
      featured: true,
    },
    {
      branch: 'football',
      title: 'افتتاح الموسم التدريبي الجديد لأكاديمية الناشئين',
      content: 'أعلنت إدارة فرع كرة القدم عن بدء التسجيل في أكاديمية الناشئين للموسم الجديد، حيث ستشمل الفئات: الأشبال (10-12 سنة)، الأواسط (13-15 سنة)، والشباب (16-18 سنة). التدريبات تقام تحت إشراف طاقم تقني حاصل على الشهادات الوطنية.',
      image: '/images/gallery/youth.jpg',
      featured: true,
    },
    {
      branch: 'football',
      title: 'لاعب النادي ياسين مرابط ينضم إلى معسكر المنتخب الوطني للشباب',
      content: 'توجت جهود النادي باختيار اللاعب الموهوب ياسين مرابط للالتحاق بمعسكر المنتخب الوطني للشباب، وذلك تقديراً لأدائه المتميز هذا الموسم. الإدارة التقنية للنادي تهنئ اللاعب وتؤكد استمرارها في دعم المواهب الواعدة.',
      image: '/images/gallery/team.jpg',
      featured: false,
    },
    {
      branch: 'basketball',
      title: 'سلة الرائد تخطف فوزاً في الثواني الأخيرة',
      content: 'فاز فريق كرة السلة بنتيجة 78-76 في مباراة ملحمية حسمها التصويب الثلاثي في الثانية الأخيرة، ليواصل الفريق سلسلته اللا هزيمة هذا الموسم ويصعد إلى المربع الذهبي للبطولة الوطنية.',
      image: '/images/branches/basketball.jpg',
      featured: true,
    },
    {
      branch: 'basketball',
      title: 'دورة داخلية لكرة السلة على كأس الإدارة',
      content: 'ينظم الفرع دورة داخلية بجميع الفئات السنية خلال العطلة المقبل، بمشاركة أكثر من 60 لاعباً ولاعبة، مع تكريم الفائزين الثلاثة الأوائل وأفضل الهدافين.',
      image: '/images/gallery/training.jpg',
      featured: false,
    },
    {
      branch: 'handball',
      title: 'أيدي الرائد الذهبية.. تأهل مبكر لدور الـ16',
      content: 'ضمن فريق كرة اليد بطاقته التأهل المبكر إلى دور الـ16 من كأس الجمهورية بعد فوز مقنع بنتيجة 29-21 في مباراة قادها الكابتن عبد القادر حمدي بـ11 تمريرة حاسمة.',
      image: '/images/branches/handball.jpg',
      featured: false,
    },
    {
      branch: 'volleyball',
      title: 'الكرة الطائرة تفتتح دورة تدريبية للمدربات',
      content: 'أطلق الفرع دورة تكوينية للمدربات الشابات بالتعاون مع الرابطة الولائية، تهدف إلى توحيد المنهجيات التدريبية ونشر ثقافة الكرة الطائرة في مدارس سعيدة.',
      image: '/images/branches/volleyball.jpg',
      featured: false,
    },
    {
      branch: 'athletics',
      title: '3 ميداليات جديدة في بطولة الولاية لألعاب القوى',
      content: 'تألق لاعبو الفرع في بطولة الولاية بحصد ميدالية ذهبية في سباق 400م وفضيتين في القفز العالي ورمي الجلة، ليكونوا ضمن القائمة المعلقة للمشاركة في البطولة الوطنية.',
      image: '/images/branches/athletics.jpg',
      featured: false,
    },
    {
      branch: 'martial-arts',
      title: 'خمس ميداليات ملونة في التايكوندو المفتوح',
      content: 'حصد فريق التايكوندو 5 ميداليات (2 ذهبية، 2 فضية، 1 برونزية) في البطولة الدولية المفتوحة، في إنجاز غير مسبوق يعكس جودة البرنامج التدريبي للفرع.',
      image: '/images/branches/martial-arts.jpg',
      featured: true,
    },
    {
      branch: 'swimming',
      title: 'السباح وائل بوجمعة يكسر الرقم القياسي الولائي',
      content: 'حقق السباح وائل بوجمعة رقماً قياسياً جديداً في سباق 100م حرة للفئة العمرية تحت 16 سنة بزمن 56.3 ثانية، متجاوزاً الرقم السابق المحتفظ به منذ 6 سنوات.',
      image: '/images/branches/swimming.jpg',
      featured: false,
    },
    {
      branch: 'table-tennis',
      title: 'دوري تنس الطاولة الداخلي يختتم بمشاركة 40 لاعباً',
      content: 'اختم الفرع دوريته الداخلية التي امتدت لثلاثة أسابيع بمشاركة 40 لاعباً من مختلف الفئات، وتوج اللاعب إسلام سعدي بلقب البطولة في فئة الكبار.',
      image: '/images/branches/table-tennis.jpg',
      featured: false,
    },
    {
      branch: 'chess',
      title: 'بطل سعيدة للشطرنج من الرائد.. مرة أخرى',
      content: 'توّج اللاعب إبراهيم بن عيسى بلقب بطل الولاية للشطرنج في النسخة الـ24 من البطولة الولائية بعد تفوقه في الجولة الأخيرة أمام أقوى المنافسين، ليحافظ على اللقب للموسم الثاني على التوالي ويرفع نقاطه في التصنيف الوطني.',
      image: '/images/branches/chess.jpg',
      featured: false,
    },
    {
      branch: 'cycling',
      title: 'الرائد يتألق في سباق الجبل الدولي',
      content: 'أنهى دراج النادي خالد مسعودي سباق الجبل الدولي في المركز الخامس على الترتيب العام ضمن فئة الشباب، في أفضل نتيجة لدراج سعيدي في هذه النسخة التي جمعت 120 مشاركاً من 8 دول.',
      image: '/images/branches/cycling.jpg',
      featured: false,
    },
    {
      branch: 'gymnastics',
      title: 'ميداليتان ذهبيتان في الجمباز الجهوي',
      content: 'حصدت لاعبتا النادي لينا بوحجر وهاجر سلطاني ميداليتين ذهبيتين في بطولة الجمباز الجهوية للسيدات، الأولى في حركات الأرض والثانية في الشريط الإيقاعي، وسط منافسة قوية جمعت 12 نادياً.',
      image: '/images/branches/gymnastics.jpg',
      featured: false,
    },
    {
      branch: 'boxing',
      title: 'ثلاثة أبطال جدد في حلبة الملاكمة',
      content: 'تأهل ثلاثة ملاكمين من النادي إلى منافسات البطولة الوطنية بعد تتويجهم بميداليات ملونة في البطولة الولائية، ويتصدرهم حسين بلعيد الذي فاز بلقب وزن الـ60 كغ بضربة قاضية في الجولة الثانية.',
      image: '/images/branches/boxing.jpg',
      featured: false,
    },
  ]
  for (let i = 0; i < newsData.length; i++) {
    const n = newsData[i]
    await db.news.create({
      data: {
        title: n.title,
        content: n.content,
        image: n.image,
        featured: n.featured,
        branchId: branches[n.branch].id,
        createdAt: new Date(Date.now() - i * 86400000 * 3),
      },
    })
  }
  console.log('✅ الأخبار')

  // ============ اللاعبون ============
  const playersData: Record<string, Array<{ name: string; position: string; number?: number; age?: number }>> = {
    football: [
      { name: 'أمين بوعلام', position: 'مهاجم', number: 9, age: 24 },
      { name: 'ياسين مرابط', position: 'جناح أيسر', number: 11, age: 21 },
      { name: 'سيف الدين قاسمي', position: 'وسط ميدان', number: 8, age: 26 },
      { name: 'عبد الرحمن زيتوني', position: 'مدافع', number: 4, age: 28 },
      { name: 'بلال شريف', position: 'حارس مرمى', number: 1, age: 25 },
      { name: 'إلياس قدور', position: 'مدافع', number: 5, age: 23 },
      { name: 'حمزة لعروسي', position: 'وسط ميدان', number: 6, age: 22 },
      { name: 'رياض بن عمر', position: 'جناح أيمن', number: 7, age: 20 },
      { name: 'مروان حجاج', position: 'ظهير أيسر', number: 3, age: 24 },
      { name: 'أنيس طالبي', position: 'ظهير أيمن', number: 2, age: 22 },
      { name: 'كريم بوقرة', position: 'مهاجم', number: 19, age: 19 },
      { name: 'وسام بن ناصر', position: 'وسط مهاجم', number: 10, age: 23 },
    ],
    basketball: [
      { name: 'سوفيان لعقاب', position: 'صانع ألعاب', number: 4, age: 25 },
      { name: 'طارق ميهوبي', position: 'ظهير ريم', number: 7, age: 23 },
      { name: 'أيوب سلامي', position: 'مهاجم قوي', number: 9, age: 26 },
      { name: 'منير زروقي', position: 'فيفوت', number: 11, age: 22 },
      { name: 'جواد بلقاسم', position: 'وسط', number: 15, age: 27 },
    ],
    handball: [
      { name: 'عبد القادر حمدي', position: 'وسط ميدان', number: 10, age: 27 },
      { name: 'فؤاد بوجلة', position: 'ظهير أيسر', number: 8, age: 24 },
      { name: 'رضا عمراني', position: 'حارس مرمى', number: 12, age: 29 },
      { name: 'هشام بوعزة', position: 'محور', number: 5, age: 23 },
      { name: 'نبيل الشريفي', position: 'جناح أيمن', number: 6, age: 21 },
    ],
    volleyball: [
      { name: 'إسماعيل دحماني', position: 'معتدي', number: 1, age: 25 },
      { name: 'أدهم بركات', position: 'محرر', number: 4, age: 22 },
      { name: 'يوسف قندوز', position: 'مستقبل', number: 7, age: 24 },
      { name: 'وليد مسعودي', position: 'وسط', number: 9, age: 26 },
    ],
    athletics: [
      { name: 'محمد الأمين زيتوني', position: '400 متر', age: 20 },
      { name: 'سارة حمداوي', position: 'قفز عالي', age: 19 },
      { name: 'زكرياء لحمر', position: 'رمي الجلة', age: 22 },
      { name: 'نور الهدى بلعيد', position: '100 متر حواجز', age: 18 },
    ],
    'martial-arts': [
      { name: 'إلياس ثامر', position: 'كاراتيه - كوميتيه -60كغ', age: 21 },
      { name: 'عثمان زروكي', position: 'تايكوندو -68كغ', age: 20 },
      { name: 'محمد سعيد عثماني', position: 'جودو -73كغ', age: 23 },
      { name: 'ليث بن علي', position: 'كاراتيه كاتا', age: 19 },
    ],
    swimming: [
      { name: 'وائل بوجمعة', position: '100م حرة', age: 15 },
      { name: 'أدهم شعبان', position: '50م صدر', age: 17 },
      { name: 'إيناس مرابط', position: '100م ظهر', age: 16 },
    ],
    'table-tennis': [
      { name: 'إسلام سعدي', position: 'فئة الكبار', age: 22 },
      { name: 'أمينة جبلي', position: 'فئة السيدات', age: 19 },
      { name: 'يوسف لعجاج', position: 'فئة الناشئين', age: 15 },
    ],
    chess: [
      { name: 'إبراهيم بن عيسى', position: 'بطل الولاية - التصنيف الأول', age: 24 },
      { name: 'مريم قاسمي', position: 'فئة السيدات', age: 20 },
      { name: 'عبد الحق لعمامرة', position: 'فئة الناشئين', age: 15 },
      { name: 'نسرين بوعلام', position: 'فئة البراعم', age: 12 },
    ],
    cycling: [
      { name: 'خالد مسعودي', position: 'سباق الطريق', age: 23 },
      { name: 'سفيان حجاج', position: 'سباق الجبل', age: 21 },
      { name: 'بلال عمراني', position: 'سباق الزمن الفردي', age: 25 },
    ],
    gymnastics: [
      { name: 'لينا بوحجر', position: 'جمباز فني - سيدات', age: 16 },
      { name: 'هاجر سلطاني', position: 'جمباز إيقاعي', age: 15 },
      { name: 'أيوب بن عمار', position: 'جمباز فني - رجال', age: 18 },
    ],
    boxing: [
      { name: 'حسين بلعيد', position: 'وزن خفيف -60كغ', age: 22 },
      { name: 'رضا بن حمزة', position: 'وزن متوسط -71كغ', age: 24 },
      { name: 'ياسمين زروقي', position: 'سيدات -54كغ', age: 20 },
    ],
  }
  for (const [slug, players] of Object.entries(playersData)) {
    for (const p of players) {
      await db.player.create({
        data: {
          name: p.name,
          position: p.position,
          number: p.number ?? null,
          age: p.age ?? null,
          branchId: branches[slug].id,
        },
      })
    }
  }
  console.log('✅ اللاعبون')

  // ============ المباريات ============
  const matchesData = [
    { branch: 'football', opponent: 'اتحاد سعيدة', date: daysFromNow(-3, 16), venue: 'home', location: 'الملعب البلدي بسعيدة', competition: 'البطولة الولائية - الجولة 8', homeScore: 3, awayScore: 1, status: 'finished' },
    { branch: 'football', opponent: 'مولودية عين سردن', date: daysFromNow(-10, 16), venue: 'away', location: 'ملعب عين سردن', competition: 'البطولة الولائية - الجولة 7', homeScore: 2, awayScore: 2, status: 'finished' },
    { branch: 'football', opponent: 'شباب سدير', date: daysFromNow(5, 16), venue: 'away', location: 'ملعب سدير الجديد', competition: 'البطولة الولائية - الجولة 9', status: 'upcoming' },
    { branch: 'football', opponent: 'وفاء تيغنيف', date: daysFromNow(12, 16), venue: 'home', location: 'الملعب البلدي بسعيدة', competition: 'كأس الولاية - دور الـ16', status: 'upcoming' },
    { branch: 'basketball', opponent: 'نجم غليزان', date: daysFromNow(-6, 18), venue: 'home', location: 'القاعة المتعددة الرياضات', competition: 'البطولة الوطنية', homeScore: 78, awayScore: 76, status: 'finished' },
    { branch: 'basketball', opponent: 'شباب تيارت', date: daysFromNow(4, 18), venue: 'away', location: 'قاعة تيارت الرياضية', competition: 'البطولة الوطنية', status: 'upcoming' },
    { branch: 'handball', opponent: 'ترجعونة للكرة اليد', date: daysFromNow(9, 17), venue: 'home', location: 'القاعة المتعددة الرياضات', competition: 'كأس الجمهورية - دور الـ16', status: 'upcoming' },
    { branch: 'volleyball', opponent: 'اتحاد مخدمة', date: daysFromNow(7, 19), venue: 'home', location: 'القاعة المغطاة', competition: 'البطولة الجهوية', status: 'upcoming' },
    { branch: 'martial-arts', opponent: 'البطولة الدولية المفتوحة للتايكوندو', date: daysFromNow(15, 9), venue: 'away', location: 'قصر الرياضات - الجزائر العاصمة', competition: 'بطولة دولية', status: 'upcoming' },
  ]
  for (const m of matchesData) {
    await db.match.create({
      data: {
        opponent: m.opponent,
        date: m.date,
        venue: m.venue,
        location: m.location,
        competition: m.competition,
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
        status: m.status,
        branchId: branches[m.branch].id,
      },
    })
  }
  console.log('✅ المباريات')

  // ============ الجدول التدريبي ============
  const trainingData = [
    { branch: 'football', day: 'السبت', time: '09:00 - 11:00', location: 'الملعب البلدي', coach: 'المدرب صالح بلحاج', groupName: 'الفريق الأول' },
    { branch: 'football', day: 'الإثنين', time: '16:30 - 18:30', location: 'الملعب البلدي', coach: 'المدرب صالح بلحاج', groupName: 'الفريق الأول' },
    { branch: 'football', day: 'الأربعاء', time: '15:00 - 17:00', location: 'ملعب أكاديمية النادي', coach: 'المدرب كمال زيدان', groupName: 'أكاديمية الناشئين' },
    { branch: 'basketball', day: 'الأحد', time: '17:00 - 19:00', location: 'القاعة المتعددة', coach: 'المدرب منير قاسمي', groupName: 'الكبار' },
    { branch: 'basketball', day: 'الثلاثاء', time: '16:00 - 18:00', location: 'القاعة المتعددة', coach: 'المدرب منير قاسمي', groupName: 'الناشئين' },
    { branch: 'handball', day: 'السبت', time: '17:00 - 19:00', location: 'القاعة المتعددة', coach: 'المدرب جمال بوزيد', groupName: 'الكبار' },
    { branch: 'handball', day: 'الخميس', time: '16:00 - 18:00', location: 'القاعة المتعددة', coach: 'المدرب جمال بوزيد', groupName: 'الشباب' },
    { branch: 'volleyball', day: 'الأحد', time: '18:00 - 20:00', location: 'القاعة المغطاة', coach: 'المدربة نادية سعدي', groupName: 'الكبار' },
    { branch: 'volleyball', day: 'الأربعاء', time: '17:00 - 19:00', location: 'القاعة المغطاة', coach: 'المدربة نادية سعدي', groupName: 'السيدات' },
    { branch: 'athletics', day: 'السبت', time: '07:00 - 09:00', location: 'مضمار الملعب البلدي', coach: 'المدرب رشيد بوكرين', groupName: 'جميع الفئات' },
    { branch: 'athletics', day: 'الثلاثاء', time: '07:00 - 09:00', location: 'مضمار الملعب البلدي', coach: 'المدرب رشيد بوكرين', groupName: 'جميع الفئات' },
    { branch: 'martial-arts', day: 'الأحد', time: '16:00 - 18:00', location: 'قاعة الفنون القتالية', coach: 'المدرب حسين سلطاني', groupName: 'الكاراتيه' },
    { branch: 'martial-arts', day: 'الأربعاء', time: '16:00 - 18:00', location: 'قاعة الفنون القتالية', coach: 'المدرب وليد أمزيان', groupName: 'التايكوندو' },
    { branch: 'swimming', day: 'الإثنين', time: '07:00 - 09:00', location: 'المسبح الأولمبي', coach: 'المدرب فريد حجاج', groupName: 'السباحين' },
    { branch: 'swimming', day: 'الخميس', time: '07:00 - 09:00', location: 'المسبح الأولمبي', coach: 'المدرب فريد حجاج', groupName: 'مبتدئون' },
    { branch: 'table-tennis', day: 'الثلاثاء', time: '15:00 - 17:00', location: 'قاعة تنس الطاولة', coach: 'المدرب عمار زروق', groupName: 'جميع الفئات' },
    { branch: 'table-tennis', day: 'الخميس', time: '15:00 - 17:00', location: 'قاعة تنس الطاولة', coach: 'المدرب عمار زروق', groupName: 'جميع الفئات' },
    { branch: 'chess', day: 'السبت', time: '14:00 - 16:00', location: 'قاعة الشطرنج بالنادي', coach: 'المدرب عمار بلقاسم', groupName: 'جميع الفئات' },
    { branch: 'chess', day: 'الأربعاء', time: '14:00 - 16:00', location: 'قاعة الشطرنج بالنادي', coach: 'المدرب عمار بلقاسم', groupName: 'جميع الفئات' },
    { branch: 'cycling', day: 'الجمعة', time: '06:30 - 09:00', location: 'طريق الجبل الوطني', coach: 'المدرب رشيد حمداوي', groupName: 'فريق الطريق' },
    { branch: 'gymnastics', day: 'السبت', time: '13:00 - 15:00', location: 'قاعة الجمباز', coach: 'المدربة سعاد بلعيد', groupName: 'السيدات' },
    { branch: 'gymnastics', day: 'الثلاثاء', time: '13:00 - 15:00', location: 'قاعة الجمباز', coach: 'المدربة سعاد بلعيد', groupName: 'الناشئات' },
    { branch: 'boxing', day: 'الأحد', time: '18:00 - 20:00', location: 'حلبة الملاكمة بالنادي', coach: 'المدرب جيلالي بوزيد', groupName: 'جميع الفئات' },
    { branch: 'boxing', day: 'الخميس', time: '18:00 - 20:00', location: 'حلبة الملاكمة بالنادي', coach: 'المدرب جيلالي بوزيد', groupName: 'جميع الفئات' },
  ]
  for (const t of trainingData) {
    const { branch, ...rest } = t
    await db.training.create({ data: { ...rest, branchId: branches[branch].id } })
  }
  console.log('✅ الجدول التدريبي')

  // ============ الإنجازات ============
  const achievementsData = [
    { title: 'بطل المجموعة الغربية - البطولة الولائية', year: '2024', description: 'تتويج فريق كرة القدم بلقب بطل المجموعة بعد موسم استثنائي', branch: 'football' },
    { title: 'كأس الولاية لكرة القدم', year: '2025', description: 'الفوز بكأس الولاية في أول موسم كامل لتاريخ النادي', branch: 'football' },
    { title: 'المربع الذهبي - كرة السلة', year: '2024', description: 'تأهل فريق السلة إلى المربع الذهبي للبطولة الوطنية', branch: 'basketball' },
    { title: 'دوري الجهوي لكرة اليد', year: '2025', description: 'لقب الدوري الجهوي بلا هزيمة واحدة', branch: 'handball' },
    { title: '5 ميداليات في التايكوندو الدولي المفتوح', year: '2024', description: 'ميداليات ذهبية وفضية وبرونزية في بطولة دولية', branch: 'martial-arts' },
    { title: 'أفضل نادي تكويني على مستوى الولاية', year: '2025', description: 'تكريم من مديرية الشباب والرياضة لجهود النادي في التكوين', branch: null },
    { title: '10 ميداليات في ألعاب القوى الولائية', year: '2024', description: 'حصاد مميز لعام كامل من التألق في المضمار', branch: 'athletics' },
    { title: 'تأسيس النادي الرياضي الرائد', year: '2024', description: 'التأسيس الرسمي للنادي بمبادرة من أبناء بلدية سعيدة ليكون منارة للرياضة المحلية', branch: null },
  ]
  for (const a of achievementsData) {
    await db.achievement.create({
      data: {
        title: a.title,
        year: a.year,
        description: a.description,
        branchId: a.branch ? branches[a.branch].id : null,
      },
    })
  }
  console.log('✅ الإنجازات')

  // ============ معرض الصور ============
  const galleryData = [
    { url: '/images/gallery/trophy.jpg', caption: 'لحظة رفع كأس الولاية 2025', branch: 'football' },
    { url: '/images/gallery/fans.jpg', caption: 'الجمهور الرائد في المدرجات', branch: 'football' },
    { url: '/images/gallery/team.jpg', caption: 'عائلة النادي تتوحد بعد الفوز', branch: 'football' },
    { url: '/images/gallery/youth.jpg', caption: 'أكاديمية الناشئين.. مستقبل مشرق', branch: 'football' },
    { url: '/images/gallery/training.jpg', caption: 'حصة تدريبية مسائية تحت الأضواء', branch: 'football' },
    { url: '/images/branches/basketball.jpg', caption: 'من مباريات فريق السلة', branch: 'basketball' },
    { url: '/images/branches/handball.jpg', caption: 'حماس لاعبي كرة اليد', branch: 'handball' },
    { url: '/images/branches/swimming.jpg', caption: 'سباحونا في المسبح الأولمبي', branch: 'swimming' },
  ]
  for (const g of galleryData) {
    await db.galleryItem.create({
      data: { url: g.url, caption: g.caption, branchId: branches[g.branch].id },
    })
  }
  console.log('✅ معرض الصور')

  // ============ طلبات انضمام تجريبية ============
  await db.enrollment.createMany({
    data: [
      { fullName: 'محمد الأمين بن سعيد', age: 14, phone: '0555123456', note: 'لعبت في فريق الحي لمدة سنتين', branchId: branches.football.id },
      { fullName: 'أنس بوزيد', age: 16, phone: '0661987654', note: '', branchId: branches.football.id },
      { fullName: 'سارة العايب', age: 12, phone: '0770112233', note: 'أتدرب سباحة منذ عام', branchId: branches.swimming.id },
    ],
  })
  console.log('✅ طلبات الانضمام التجريبية')

  // ============ جداول الترتيب ============
  const standingsData: Record<
    string,
    Array<{ teamName: string; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number }>
  > = {
    football: [
      { teamName: 'الرائد سعيدة', played: 8, won: 6, drawn: 2, lost: 0, goalsFor: 19, goalsAgainst: 6 },
      { teamName: 'اتحاد سعيدة', played: 8, won: 5, drawn: 1, lost: 2, goalsFor: 15, goalsAgainst: 9 },
      { teamName: 'نجوم الحساسنة', played: 8, won: 4, drawn: 2, lost: 2, goalsFor: 12, goalsAgainst: 10 },
      { teamName: 'أمل عين الحجر', played: 8, won: 3, drawn: 1, lost: 4, goalsFor: 10, goalsAgainst: 12 },
      { teamName: 'شباب سيدي بوبكر', played: 8, won: 2, drawn: 1, lost: 5, goalsFor: 8, goalsAgainst: 15 },
      { teamName: 'فتوح هونت', played: 8, won: 0, drawn: 1, lost: 7, goalsFor: 4, goalsAgainst: 16 },
    ],
    basketball: [
      { teamName: 'الرائد سعيدة', played: 10, won: 8, drawn: 0, lost: 2, goalsFor: 745, goalsAgainst: 690 },
      { teamName: 'نجم غليزان', played: 10, won: 7, drawn: 0, lost: 3, goalsFor: 720, goalsAgainst: 700 },
      { teamName: 'شباب تيارت', played: 10, won: 5, drawn: 0, lost: 5, goalsFor: 710, goalsAgainst: 715 },
      { teamName: 'وفاق المسيلة', played: 10, won: 3, drawn: 0, lost: 7, goalsFor: 680, goalsAgainst: 720 },
      { teamName: 'مستقبل سطيف', played: 10, won: 2, drawn: 0, lost: 8, goalsFor: 660, goalsAgainst: 740 },
    ],
    handball: [
      { teamName: 'الرائد سعيدة', played: 9, won: 7, drawn: 1, lost: 1, goalsFor: 248, goalsAgainst: 210 },
      { teamName: 'ترجعونة للكرة اليد', played: 9, won: 6, drawn: 2, lost: 1, goalsFor: 240, goalsAgainst: 215 },
      { teamName: 'أمل الأبيض مجهاد', played: 9, won: 4, drawn: 1, lost: 4, goalsFor: 225, goalsAgainst: 230 },
      { teamName: 'نجوم وادي سوف', played: 9, won: 2, drawn: 0, lost: 7, goalsFor: 205, goalsAgainst: 245 },
      { teamName: 'شباب بسكرة', played: 9, won: 1, drawn: 0, lost: 8, goalsFor: 190, goalsAgainst: 260 },
    ],
  }
  for (const [slug, rows] of Object.entries(standingsData)) {
    for (const r of rows) {
      const points = slug === 'basketball' ? r.won * 2 : r.won * 3 + r.drawn
      await db.standing.create({
        data: {
          teamName: r.teamName,
          played: r.played,
          won: r.won,
          drawn: r.drawn,
          lost: r.lost,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          points,
          branchId: branches[slug].id,
        },
      })
    }
  }
  console.log('✅ جداول الترتيب')

  // ============ متجر النادي ============
  const productsData = [
    { name: 'القميص الرسمي للنادي', description: 'القميص الرسمي للموسم الجديد بألوان النادي الكحلية والفضية، قماش متنفس عالي الجودة مع الشعار المطرز على الصدر', price: 3500, image: '/images/products/jersey.jpg', category: 'ملابس' },
    { name: 'سترة التدريب', description: 'سترة تدريب رسمية مقاومة للرياح مع سحّاب فضي وشعار النادي المطرز', price: 5500, image: '/images/products/jacket.jpg', category: 'ملابس' },
    { name: 'القبعة الرسمية', description: 'قبعة مخيطة بشعار النادي المطرز بالفضي، مقاس قابل للتعديل يناسب الجميع', price: 1200, image: '/images/products/cap.jpg', category: 'إكسسوارات' },
    { name: 'حقيبة النادي الرياضية', description: 'حقيبة رياضية واسعة مع جيب مخصص للأحذية وحزام كتف مبطن وألوان النادي', price: 4000, image: '/images/products/bag.jpg', category: 'إكسسوارات' },
    { name: 'الكرة الرسمية', description: 'كرة قدم رسمية بالتصميم الخاص للنادي، مناسبة للملاعب العشبية والترابية', price: 2800, image: '/images/products/ball.jpg', category: 'معدات' },
    { name: 'الشال الجماهيري', description: 'شال جماهيري منسوج بألوان النادي وشعاره، رمز الانتماء في المدرجات', price: 900, image: '/images/products/scarf.jpg', category: 'إكسسوارات' },
  ]
  const products: Record<string, { id: string }> = {}
  for (const p of productsData) {
    const created = await db.product.create({ data: p })
    products[p.name] = created
  }
  await db.shopOrder.createMany({
    data: [
      { customerName: 'يوسف مبروكي', phone: '0770123456', size: 'L', note: 'الاستلام من مقر النادي', status: 'pending', productId: products['القميص الرسمي للنادي'].id },
      { customerName: 'ولاء بن عمر', phone: '0555987654', size: '', note: 'هدية لأخي الصغير', status: 'pending', productId: products['الشال الجماهيري'].id },
    ],
  })
  console.log('✅ متجر النادي (6 منتجات + طلبان)')

  // ============ الفيديوهات ============
  await db.videoItem.createMany({
    data: [
      { title: 'جولة تعريفية في مجمع النادي الرياضي', url: '/videos/club-tour.mp4', thumb: '/images/hero.jpg', branchId: null },
      { title: 'أجواء التدريبات المسائية تحت الأضواء', url: '/videos/training.mp4', thumb: '/images/gallery/training.jpg', branchId: branches.football.id },
    ],
  })
  console.log('✅ الفيديوهات')

  // ============ إطارات وأعضاء الفروع ============
  // المناصب بالترتيب الهرمي: رئيس الفرع ← نائب الرئيس ← الأمين العام ← المدير التقني ← نائب المدير التقني ← مدرب ← عضو
  const memberTemplates: Array<{
    position: string
    sortOrder: number
    specialty: string
  }> = [
    { position: 'رئيس الفرع', sortOrder: 1, specialty: 'إدارة رياضية' },
    { position: 'نائب رئيس الفرع', sortOrder: 2, specialty: 'تدبير ومنظمة' },
    { position: 'الأمين العام للفرع', sortOrder: 3, specialty: 'كتابة وإدارة' },
    { position: 'المدير التقني للفرع', sortOrder: 4, specialty: 'أستاذ تعليم بدني' },
    { position: 'نائب المدير التقني', sortOrder: 5, specialty: 'تأطير الناشئين' },
    { position: 'مدرب', sortOrder: 6, specialty: 'تكوين' },
  ]

  const membersData: Record<string, Array<[string, string, string]>> = {
    // [الاسم، اللقب، سنة الميلاد]
    football: [
      ['كمال', 'بوعلام', '1978'],
      ['رياض', 'حمداوي', '1984'],
      ['سفيان', 'مرابط', '1988'],
      ['عبد القادر', 'قاسمي', '1975'],
      ['ناصر', 'زروقي', '1990'],
      ['ياسين', 'شريفي', '1992'],
    ],
    basketball: [
      ['منير', 'بلحاج', '1980'],
      ['أمين', 'سعداوي', '1986'],
      ['هشام', 'بن ناصر', '1989'],
      ['طارق', 'لعروسي', '1977'],
      ['وليد', 'مباركي', '1991'],
      ['سامي', 'قدور', '1993'],
    ],
    handball: [
      ['حمزة', 'عياد', '1979'],
      ['بلال', 'دحماني', '1985'],
      ['فؤاد', 'بوزيد', '1988'],
      ['إسلام', 'مقهني', '1982'],
      ['زكرياء', 'حسني', '1990'],
      ['عمر', 'تايبي', '1994'],
    ],
    volleyball: [
      ['عادل', 'براهيمي', '1981'],
      ['مسعود', 'حجاج', '1987'],
      ['بلال', 'سمعي', '1990'],
      ['أنيس', 'لعماري', '1984'],
      ['رضا', 'بوعزة', '1992'],
      ['حاتم', 'زلال', '1995'],
    ],
    athletics: [
      ['سمير', 'بن عيسى', '1976'],
      ['كريم', 'دحمان', '1983'],
      ['جواد', 'سليماني', '1989'],
      ['إلياس', 'مزياني', '1991'],
      ['حبيب', 'طالبي', '1985'],
      ['نبيل', 'غارس', '1993'],
    ],
    'martial-arts': [
      ['موسى', 'بوعلام', '1980'],
      ['سفيان', 'برّادي', '1986'],
      ['أيمن', 'لعبيض', '1990'],
      ['يوسف', 'خليفي', '1984'],
      ['إلياس', 'بن داود', '1992'],
      ['عبد الرحمان', 'ميهوبي', '1995'],
    ],
    swimming: [
      ['مراد', 'بونعامة', '1978'],
      ['كريم', 'بن عمر', '1985'],
      ['سيف', 'العابد', '1990'],
      ['أمين', 'زاوي', '1987'],
      ['عبد الحق', 'مرزوقي', '1993'],
      ['خلده', 'بن صالح', '1996'],
    ],
    'table-tennis': [
      ['فريد', 'زيتوني', '1982'],
      ['عمر', 'حمداني', '1988'],
      ['زين الدين', 'عمراوي', '1991'],
      ['طارق', 'بن عمور', '1985'],
      ['حسام', 'سكيني', '1994'],
      ['إسحاق', 'مداني', '1996'],
    ],
    chess: [
      ['عبد النور', 'حساني', '1975'],
      ['محمد', 'أمين كمال', '1983'],
      ['سليم', 'بوحفص', '1989'],
      ['عمار', 'يحياوي', '1981'],
      ['نور الدين', 'قايد', '1990'],
      ['أسامة', 'بلقاسم', '1995'],
    ],
    cycling: [
      ['حمداني', 'لعروسي', '1979'],
      ['أبو بكر', 'سعدون', '1986'],
      ['رضوان', 'مباركي', '1990'],
      ['شرف الدين', 'عمارة', '1984'],
      ['بلال', 'حملاوي', '1992'],
      ['عزيز', 'بوزيان', '1995'],
    ],
    gymnastics: [
      ['نادية', 'بن علي', '1985'],
      ['سارة', 'حمداوي', '1990'],
      ['هدى', 'مرابط', '1992'],
      ['أمال', 'قاسمي', '1987'],
      ['ليلى', 'زروقي', '1994'],
      ['وسام', 'شريفي', '1996'],
    ],
    boxing: [
      ['عبد الحفيظ', 'بوعدو', '1977'],
      ['مصطفى', 'حجاج', '1984'],
      ['إسماعيل', 'سمعي', '1989'],
      ['رشيد', 'لعماري', '1983'],
      ['حسين', 'بوعزة', '1991'],
      ['خالد', 'غارس', '1994'],
    ],
  }

  const year = 2025
  for (const [slug, list] of Object.entries(membersData)) {
    const branch = branches[slug]
    if (!branch) continue
    for (let i = 0; i < list.length; i++) {
      const [firstName, lastName, birthYear] = list[i]
      const tpl = memberTemplates[i % memberTemplates.length]
      await db.branchMember.create({
        data: {
          firstName,
          lastName,
          birthDate: `${birthYear}-05-15`,
          position: tpl.position,
          specialty: tpl.specialty,
          phone: `0770${String(100000 + i * 7 + year % 100).slice(0, 6)}`,
          appointedAt: `${year - 1}-09-01`,
          notes: '',
          sortOrder: tpl.sortOrder,
          branchId: branch.id,
        },
      })
    }
  }
  console.log('✅ إطارات وأعضاء الفروع')

  // ============ كتب النادي: محاضر وملفات ومراسلات ============
  const footPresident = await db.branchMember.findFirst({
    where: { branchId: branches.football.id, position: 'رئيس الفرع' },
  })
  const footTechDir = await db.branchMember.findFirst({
    where: { branchId: branches.football.id, position: 'المدير التقني للفرع' },
  })
  const basketPresident = await db.branchMember.findFirst({
    where: { branchId: branches.basketball.id, position: 'رئيس الفرع' },
  })

  await db.clubDocument.createMany({
    data: [
      {
        refNumber: 'CRS/2025/001',
        title: 'محضر تنصيب مكتب فرع كرة القدم',
        type: 'minute',
        category: 'محاضر التنصيب',
        content:
          'انطلاقاً من القرار رقم 12/2025 الصادر عن الإدارة العامة للنادي الرياضي الرائد المتعدد الرياضات،\nوبعد استكمال كافة الإجراءات القانونية والمادية،\n\nتم يوم الخميس 04 سبتمبر 2025، بمقر النادي بلدية سعيدة، تنصيب مكتب فرع كرة القدم الجديد برئاسة السيد كمال بوعلام وعضوية الإطارات المعنية أدناه، وذلك لولاية أربع سنوات.\n\nحضر التنصيب: الإدارة العامة، رئيس فرع كرة القدم، الأمين العام للفرع والمدير التقني.\n\nأُنجز هذا المحضر بسعيدة بتاريخ 04/09/2025 لتخليداً.',
        memberId: footPresident?.id ?? null,
        branchId: branches.football.id,
        visibleToBranch: true,
      },
      {
        refNumber: 'CRS/2025/002',
        title: 'قرار تعيين المدير التقني لفرع كرة القدم',
        type: 'file',
        category: 'ملفات الإطارات',
        content:
          'قرار رقم 13/2025\n\nيتعين على السيد عبد القادر قاسمي مهمة المدير التقني لفرع كرة القدم للنادي الرياضي الرائد، اعتباراً من تاريخ 01 سبتمبر 2025، ومهمته:\n- الإشراف على البرامج التدريبية لجميع الفئات السنية،\n- تنسيق العمل بين المدربين،\n- رفع تقرير شهري للإدارة العامة حول مستوى الفرق.',
        memberId: footTechDir?.id ?? null,
        branchId: branches.football.id,
        visibleToBranch: true,
      },
      {
        refNumber: 'CRS/2025/014',
        title: 'مراسلة إلى جميع الفروع: تعليمات انطلاق الموسم الرياضي الجديد',
        type: 'letter',
        category: 'مراسلات',
        content:
          'إلى السادة رؤساء الفروع الرياضية —\n\nالموضوع: انطلاق الموسم الرياضي 2025/2026.\n\nيشرف الإدارة العامة للنادي أن تخبركم بانطلاق الموسم الرياضي الجديد اعتباراً من 15 سبتمبر 2025، وتطلب من مكاتب الفروع:\n1. تحيين قوائم اللاعبين والتراخيص قبل 30 سبتمبر،\n2. رفع الجداول التدريبية على حسابات الفروع في الموقع الرسمي،\n3. احترام روح الانضباط والأخلاقيات الرياضية في كل المستويات.\n\nمع فائق عبارات التقدير والاحترام — الإدارة العامة',
        branchId: null,
        visibleToBranch: true,
      },
      {
        refNumber: 'CRS/2025/021',
        title: 'ملف إداري: رخصة مشاركة فريق السلة في البطولة الولائية',
        type: 'file',
        category: 'ملفات إدارية',
        content:
          'ملف يخص ترخيص مشاركة فريق فرع كرة السلة في البطولة الولائية لموسم 2025/2026، يتضمن: طلب الترخيص، القائمة النهائية للاعبين، الشهادات الطبية، ووصولات التسجيل.\n\nالحالة: مكتمل ومُرسل إلى اللايكة الجهوية.',
        memberId: basketPresident?.id ?? null,
        branchId: branches.basketball.id,
        visibleToBranch: false,
      },
      {
        refNumber: 'CRS/2025/030',
        title: 'شهادة شكر وتقدير',
        type: 'design',
        category: 'تصاميم أوراق',
        content:
          'تتقدم الإدارة العامة للنادي الرياضي الرائد بخالص الشكر والتقدير إلى السيد/السيدة المذكور أعلاه، نظير التزام المواعيد والتفاني في العمل الذي أثمرت عنه النتائج الباهرة للفرع في الموسم الماضي، سائلة الله له دوام التوفيق.',
        memberId: footTechDir?.id ?? null,
        branchId: branches.football.id,
        visibleToBranch: true,
        design: JSON.stringify({
          style: 'ceremonial',
          accent: 'silver',
          showLogo: true,
          showStamp: true,
          showWatermark: true,
          signatureName: 'رئيس النادي',
        }),
      },
      {
        refNumber: 'CRS/2025/031',
        title: 'طلب استيراد معدات رياضية لفرع الجمباز',
        type: 'request',
        category: 'طلبات',
        content:
          'طلب موجه إلى الإدارة العامة يخص استيراد معدات رياضية لفرع الجمباز تشمل: مراتب الأرضية، عوارض التوازن وطاولة القفز، لدعم تكوين الفئات الصغيرة.\nالحالة: قيد الدراسة.',
        branchId: branches.gymnastics.id,
        visibleToBranch: false,
      },
    ],
  })
  console.log('✅ كتب النادي (محاضر، ملفات، مراسلات، تصاميم)')

  // ============ إعدادات وتصميم الواجهة الرئيسية ============
  await db.siteSetting.create({
    data: {
      key: 'site',
      value: JSON.stringify({
        hero: {
          title1: { ar: 'النادي الرياضي', fr: 'Le club sportif', en: 'The Athletic Club' },
          titleGold: { ar: 'الرائد', fr: '« El Raed »', en: '« El Raed »' },
          subtitle: {
            ar: 'متعدد الرياضات — بلدية سعيدة',
            fr: 'Omnisports — Commune de Saïda',
            en: 'Omnisports — Municipality of Saïda',
          },
          desc: {
            ar: 'قوة في الوحدة.. تميز في الأداء. منارة الرياضة في سعيدة منذ أكثر من ربع قرن، نصنع الأبطال ونصنع الإنسان في',
            fr: "La force de l'unité, l'excellence de la performance. Le sport à Saïda entre dans une nouvelle ère, nous formons des champions et des hommes à travers",
            en: 'Strength in unity, excellence in performance. The beacon of sport in Saïda, we build champions and human beings across',
          },
          descTail: { ar: 'فروع رياضية.', fr: 'sections sportives.', en: 'sports sections.' },
        },
        about: {
          title: {
            ar: 'أكثر من ربع قرن من العطاء الرياضي',
            fr: 'Un nouveau siècle de dévouement sportif commence',
            en: 'A new century of athletic devotion begins',
          },
        },
        contact: {
          address: 'مقر النادي — بلدية سعيدة، ولاية سعيدة، الجزائر',
          phone: '+213 48 00 00 00',
          email: 'contact@cs-raed-saida.dz',
          facebook: 'https://facebook.com/cs.raed.saida',
          instagram: 'https://instagram.com/cs.raed.saida',
          youtube: '',
        },
        design: {
          accent: 'silver',
          heroImage: '/images/hero-all-sports.jpg',
          showStats: true,
          watermark: true,
          overlay: 0.62,
          season: '2026/2027',
        },
        // إعدادات استمارة الانخراط المطبوعة A4 — (المصدر المرجعي: DEFAULT_FORM_SETTINGS
        // في src/components/club/enrollment-form.tsx — يدمجها العميل بأمان مع أي بيانات قديمة)
        enrollment: {
          adultAge: 18,
          showGender: true,
          showNote: true,
          requirePhone: true,
          requireAddress: true,
          form: {
            rules: [
              'احترام النظام الداخلي للنادي واحترام المدربين والإدارة والمنخرطين.',
              'الالتزام بمواعيد التدريب التي يحددها الفرع الرياضي المعني.',
              'المحافظة على التجهيزات والممتلكات والمرافق الرياضية للنادي.',
              'الالتزام بتعليمات السلامة والنظافة داخل المنشآت الرياضية.',
              'عدم التدخل في الحصص التدريبية أو عرقلة سيرها.',
              'احترام تعليمات مسؤولي النادي والمنشأة الرياضية.',
              'التقيد بالإجراءات المعتمدة لدى النادي في كل العمليات.',
              'لا يتحمل النادي مسؤولية الممتلكات الشخصية للمنخرطين.',
            ],
            parentalText:
              'أنا الممضي أسفله، ولي أمر الطفل(ة) المذكور(ة) في هذه الاستمارة، أصرح بموافقتي على انضمامه(ا) إلى النادي الرياضي الهاوي المتعدد الرياضات الرائد لبلدية سعيدة، وممارسة الرياضة المحددة في الاستمارة، مع الالتزام بالقوانين والتنظيمات المعمول بها لدى النادي.',
            medicalDefault: '',
            medicalByBranch: {},
            // الرسوم للفروع المعنية فقط (مفتاح = slug الفرع) — مثل السباحة
            fees: {
              swimming: { enabled: true, subscription: 1000, insurance: 500 },
            },
            bankInfo: '',
            showBirthPlace: true,
            showSpecialty: true,
            showBloodType: true,
          },
        },
        sections: {
          about: true,
          branches: true,
          news: true,
          matches: true,
          achievements: true,
          gallery: true,
          videos: true,
          shop: true,
          join: true,
          contact: true,
        },
        languages: { ar: true, fr: true, en: true },
      }),
    },
  })
  console.log('✅ إعدادات الموقع الافتراضية')

  console.log('🎉 تمت تعبئة قاعدة البيانات بنجاح!')
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
