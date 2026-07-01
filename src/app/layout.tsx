import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gully Trader - Free Stock, Option, Forex & Crypto Trading Journal",
  description: "India's free trading journal platform for stock, option, forex, and crypto traders. Import trades, analyze performance, track discipline, and share achievement cards.",
  keywords: "trading journal, indian stocks, options trading, forex journal, crypto trading, discipline tracker, risk calculator, zerodha import, fyers import, free journal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080c14] text-[#f1f5f9] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
