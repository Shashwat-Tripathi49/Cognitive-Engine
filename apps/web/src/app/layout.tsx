import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Newsreader, Inter, JetBrains_Mono } from "next/font/google";

const serifFont = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cognitive Engine — Personal Thought Architecture",
  description:
    "A quiet, personal thinking environment for capturing and remembering your thoughts.",
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
        className={`${serifFont.variable} ${sansFont.variable} ${monoFont.variable}`}
      >
        <body style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)" }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
