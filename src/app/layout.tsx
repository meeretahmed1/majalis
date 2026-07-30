import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "مجالس — من المجلس إلى الحياة",
  description: "منصة تعليمية لدراسة الكتب التراثية والإسلامية مجلساً مجلساً",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-body">
        <SessionProviderWrapper>
          <NavBar />
          <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
