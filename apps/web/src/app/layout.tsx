import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Legora AI — Contract Analysis Platform",
  description:
    "AI-powered contract analysis platform. Summarize contracts, extract key clauses, ask legal questions, and assess risk with human-in-the-loop workflows.",
  keywords: ["contract analysis", "AI", "legal tech", "clause extraction", "risk assessment"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
