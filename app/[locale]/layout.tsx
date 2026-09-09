import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "DOCTECH - Clinic Management System",
    template: "%s | DOCTECH",
  },
  description: "Professional multi-tenant clinic management system for doctors and secretaries.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const isRTL = locale === "ar";

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"} className={`${inter.variable} dark`}>
      <body className="min-h-screen antialiased bg-[#0B131E] text-[#F8FAFC]">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position="top-right" richColors theme="dark" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}