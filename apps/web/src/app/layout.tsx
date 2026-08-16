import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk, Newsreader, Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const serifFont = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const headlineFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["600", "700", "800"],
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cognitive Engine — Personal Memory Retrieval",
  description:
    "An architectural thinking ledger for capturing, structuring, and retrieving your thoughts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider dynamic>
      <html
        lang="en"
        className={`${displayFont.variable} ${serifFont.variable} ${headlineFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
      >
        <body style={{ backgroundColor: "var(--canvas-bg)", color: "var(--ink-bone)" }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
