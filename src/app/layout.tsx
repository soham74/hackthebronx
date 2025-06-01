import type { Metadata, Viewport } from "next";
import React from "react";
import { Inter } from 'next/font/google';
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "SafePath Bronx - Intelligent Safety Navigation",
  description: "Find the safest walking routes in the Bronx using real-time crime data and community reports",
  keywords: "safety, navigation, Bronx, walking routes, crime data, community safety",
  authors: [{ name: "SafePath Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
