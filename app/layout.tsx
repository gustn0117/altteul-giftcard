import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import VisitorTracker from "@/components/VisitorTracker";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { CallModalProvider } from "@/contexts/CallModalContext";
import { SITE_URL, SITE_DESC } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "예판상품권 - 상품권 매입/매도 중개 플랫폼",
  description: SITE_DESC,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${SITE_URL}/rss.xml` },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 네이버 서치어드바이저 사이트 소유 확인 */}
        <meta name="naver-site-verification" content="d544a2f87bcf594630bb397dae06b43d73b69e42" />
        {/* Pretendard via CDN: 한글 가독성을 위한 표준 폰트 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background antialiased">
        <AuthProvider>
          <CallModalProvider>
            <Suspense fallback={null}><ScrollToTop /></Suspense>
            <Header />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <VisitorTracker />
            <MobileNav />
          </CallModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
