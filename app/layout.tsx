// import type { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "DOCTECH",
//   description: "Clinic Management System",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html>
//       <body>{children}</body>
//     </html>
//   );
// }
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "DOCTECH - Clinic Management System",
    template: "%s | DOCTECH",
  },
  description:
    "Professional multi-tenant clinic management system for doctors and secretaries.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased bg-[#0B131E] text-[#F8FAFC]">
        {children}
      </body>
    </html>
  );
}