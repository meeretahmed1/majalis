import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import NavBar from "@/components/NavBar";
import { ThemeProvider } from "@/components/theme-provider";
import { OfflineIndicator } from "@/components/OfflineIndicator";

export const viewport: Viewport = {
  themeColor: "#1F3D2B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "مجالس — من المجلس إلى الحياة",
  description: "منصة تعليمية لدراسة الكتب التراثية والإسلامية مجلساً مجلساً",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "مجالس",
  },
  icons: {
    icon: [
      { url: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-body" suppressHydrationWarning>
        <ThemeProvider>
          <SessionProviderWrapper>
            <NavBar />
            <main className="mx-auto max-w-4xl px-4 py-6">
              {children}
            </main>
            <OfflineIndicator />
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
