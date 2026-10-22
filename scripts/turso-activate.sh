#!/bin/bash
# ==================================================================
# تفعيل قاعدة بيانات Turso لموقع RCSWEB — سكربت آلي شامل
#
# الاستعمال:
#   TURSO_PLATFORM_TOKEN=<رمز_المنصة> bash scripts/turso-activate.sh
#
# الرمز يُنشأ من: https://dashboard.turso.tech → Settings → API Tokens
# (Turso CLI الرسمي يحتاج متصفحاً — هذا السكربت يستعمل REST API مباشرة،
#  فلا يحتاج سوى الرمز نفسه)
#
# ما يفعله:
#   1) إنشاء قاعدة البيانات rcsweb (أو استعمالها إن وُجدت)
#   2) إنشاء رمز وصول للقاعدة
#   3) دفع سكيما Prisma كاملة إلى القاعدة
#   4) تعبئة القاعدة بكل بيانات الموقع (scripts/seed.ts)
#   5) طباعة متغيري البيئة الجاهزين للصق في Vercel
# ==================================================================
set -euo pipefail

TOKEN="${TURSO_PLATFORM_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  echo "❌ مرر رمز المنصة هكذا: TURSO_PLATFORM_TOKEN=... bash scripts/turso-activate.sh"
  exit 1
fi

API="https://api.turso.tech/v1"
DB_NAME="rcsweb"
AUTH="Authorization: Bearer $TOKEN"

echo "🔌 التحقق من الرمز والمنظمة..."
ORGS=$(curl -sS -H "$AUTH" "$API/organizations")
echo "$ORGS" | grep -q '"organizations"' || { echo "❌ رمز غير صالح — رد المنصة: $ORGS"; exit 1; }

# المنظمة الشخصية الافتراضية = أول منظمة في القائمة
ORG=$(echo "$ORGS" | python3 -c "import sys,json; print(json.load(sys.stdin)['organizations'][0]['slug'])")
echo "   ✓ المنظمة: $ORG"

echo "🗄️  إنشاء قاعدة البيانات $DB_NAME (أو جلبها إن وُجدت)..."
CREATE_RESP=$(curl -sS -X POST -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"name\":\"$DB_NAME\"}" "$API/organizations/$ORG/databases" || true)

if echo "$CREATE_RESP" | grep -q '"Hostname"\|"hostname"'; then
  echo "   ✓ أُنشئت قاعدة جديدة"
else
  echo "   ⓘ رد الإنشاء: $(echo "$CREATE_RESP" | head -c 300)"
  echo "   ⓘ نحاول جلب قاعدة موجودة بنفس الاسم..."
fi

DB_INFO=$(curl -sS -H "$AUTH" "$API/organizations/$ORG/databases/$DB_NAME")
HOSTNAME=$(echo "$DB_INFO" | python3 -c "
import sys, json
d = json.load(sys.stdin)
db = d.get('database') or d.get('db') or d
h = db.get('Hostname') or db.get('hostname') or db.get('HttpHostname') or ''
print(h)")

if [ -z "$HOSTNAME" ]; then
  echo "❌ تعذر استخراج اسم المضيف — رد المنصة: $DB_INFO"
  exit 1
fi

TURSO_URL="libsql://$HOSTNAME"
echo "   ✓ عنوان القاعدة: $TURSO_URL"

echo "🔑 إنشاء رمز وصول للقاعدة..."
TOKEN_RESP=$(curl -sS -X POST -H "$AUTH" "$API/organizations/$ORG/databases/$DB_NAME/auth/tokens")
DB_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('jwt') or d.get('token') or '')")

if [ -z "$DB_TOKEN" ]; then
  echo "❌ تعذر إنشاء رمز القاعدة — رد المنصة: $TOKEN_RESP"
  exit 1
fi
echo "   ✓ رمز القاعدة جاهز"

echo "📐 دفع سكيما قاعدة البيانات (الجداول)..."
cd "$(dirname "$0")/.."
[ -f /tmp/turso-schema.sql ] || bunx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/turso-schema.sql
TURSO_DATABASE_URL="$TURSO_URL" TURSO_AUTH_TOKEN="$DB_TOKEN" bun scripts/turso-setup.ts

echo "🌱 تعبئة القاعدة ببيانات الموقع الكاملة..."
TURSO_DATABASE_URL="$TURSO_URL" TURSO_AUTH_TOKEN="$DB_TOKEN" bun scripts/seed.ts

echo ""
echo "=================================================================="
echo "✅ قاعدة بيانات Turso جاهزة ومعبأة بالكامل"
echo "=================================================================="
echo ""
echo "📋 الصق هذين المتغيرين في Vercel:"
echo "   Project → Settings → Environment Variables → (Production + Preview)"
echo ""
echo "TURSO_DATABASE_URL=$TURSO_URL"
echo "TURSO_AUTH_TOKEN=$DB_TOKEN"
echo ""
echo "ثم: Deployments → Redeploy (لتطبيق المتغيرين)"
echo "بعد إعادة النشر ستصبح كل بيانات الموقع دائمة ولا تُعاد تهيئتها مع كل نشر."
echo "=================================================================="
