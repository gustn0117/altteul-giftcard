import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import ChatWidget from "@/components/chat/ChatWidget";
import VisitorTracker from "@/components/VisitorTracker";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "예판상품권 - 상품권 매입/매도 중개 플랫폼",
  description: "안전하고 빠른 온라인 상품권 거래, 예판상품권에서 시작하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard via CDN: 한글 가독성을 위한 표준 폰트 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background antialiased">
        <AuthProvider>
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <ChatWidget />
          <VisitorTracker />
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
