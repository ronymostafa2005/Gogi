import type { Metadata } from "next";
import { Outfit, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Noto_Serif_KR({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "GOGI — Smart Digital Menu & AI Food Assistant | Maadi, Cairo",
  description:
    "Gogi Restaurant Maadi — explore Asian flavors, get AI-powered dish recommendations, order smart, and reserve your table.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0e0c0a] text-[#f3ece3]">{children}</body>
    </html>
  );
}
