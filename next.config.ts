import type { NextConfig } from "next";

/**
 * ترويسات الأمان لكل الردود:
 * - nosniff: يمنع تخمين أنواع المحتوى (هجمات MIME sniffing)
 * - Referrer-Policy: لا يسرّب عناوين URL الكاملة للمواقع الخارجية
 * - Permissions-Policy: يغلق الكاميرا/الميكروفون/الموقع الجغرافي/الدفع
 * - HSTS: فرض HTTPS في النشر الحقيقي (لا أثر محلياً على http)
 * - بدون X-Frame-Options: الموقع يُعرض داخل معاينة iframe مباحة،
 *   والصفحات الحساسة (لوحات الإدارة) محمية بالتوكن وليست عمومية
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
