#!/bin/bash
# =====================================================================
# تجهيز قاعدة البيانات قبل البناء (يُنفَّذ على Vercel ومحلياً عند الحاجة)
# - generate: توليد عميل Prisma (مع محركات rhel لبيئة Vercel)
# - db push : إنشاء ملف SQLite والجداول حسب schema.prisma
# - seed    : تعبئة البيانات الافتراضية (الفروع + الحسابات + المحتوى)
# يُحترم DATABASE_URL إن كان معيناً مسبقاً؛ وإلا يُستخدم المسار النسبي القياسي
# =====================================================================
set -e

# ضمان الوصول إلى ثنائيات prisma وtsx بغض النظر عن طريقة الاستدعاء
export PATH="$PWD/node_modules/.bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-file:$PWD/db/custom.db}"
echo "==> DATABASE_URL = $DATABASE_URL"

echo "==> prisma generate"
prisma generate

echo "==> prisma db push"
prisma db push --skip-generate --accept-data-loss

echo "==> seeding database"
tsx scripts/seed.ts

echo "==> database ready"
