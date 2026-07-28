import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cognitive Engine",
  description:
    "An AI-powered cognitive architecture for human thought augmentation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
