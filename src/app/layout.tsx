import type { Metadata, Viewport } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/club/pwa-register";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "النادي الرياضي الرائد متعدد الرياضات - سعيدة",
  description:
    "الموقع الرسمي للنادي الرياضي المتعدد الرياضات الرائد ببلدية سعيدة — قوة في الوحدة، تميز في الأداء. كرة قدم، سلة، يد، طائرة، ألعاب قوى، فنون قتالية، سباحة وتنس طاولة.",
  keywords: ["الرائد", "نادي رياضي", "سعيدة", "كرة القدم", "رياضة", "الجزائر"],
  authors: [{ name: "النادي الرياضي الرائد - سعيدة" }],
  icons: { icon: "/images/logo.png", apple: "/images/icons/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "النادي الرياضي الرائد متعدد الرياضات - سعيدة",
    description: "قوة في الوحدة، تميز في الأداء",
    siteName: "النادي الرياضي الرائد",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1b3a",
};

/** منع وميض الثيم: يطبق الوضع المحفوظ (النهاري/الليلي) قبل رسم الصفحة */
const themeInitScript = `
(function(){
  try {
    var raw = localStorage.getItem('raed-theme');
    var theme = 'dark';
    if (raw) { var p = JSON.parse(raw); if (p && p.state && p.state.theme) theme = p.state.theme; }
    if (theme === 'light') { document.documentElement.classList.add('light'); }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f2f5fa' : '#0f1b3a');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${cairo.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
