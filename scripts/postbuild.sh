#!/bin/bash
# =====================================================================
# ما بعد البناء: نسخ الأصول الثابتة إلى خادم standalone
# (للتشغيل المحلي عبر bun run start فقط — Vercel لا يحتاجها لأنه
#  يدير إخراج Next.js بنفسه ولا يُنشئ مجلد standalone هناك)
# =====================================================================
if [ -d .next/standalone ]; then
  echo "==> copying static assets into standalone server"
  cp -r .next/static .next/standalone/.next/
  cp -r public .next/standalone/
else
  echo "==> no standalone output (Vercel build) — skipping"
fi
