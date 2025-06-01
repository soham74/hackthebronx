import type { Metadata, Viewport } from "next";
import React from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <meta name="google-maps-api-key" content={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
