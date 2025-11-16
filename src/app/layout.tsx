// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Traesol · Fundación de Salud",
  description:
    "Fundación Traesol: operativos médicos, voluntariado y salud que transforma vidas en Chile.",
  openGraph: {
    title: "Fundación Traesol",
    description:
      "Salud que transforma. Voluntariado médico y operativos de alto impacto en Chile.",
    url: "https://fundaciontraesol.cl",
    siteName: "Traesol",
    images: [
      {
        url: "https://placehold.co/1200x630/2563eb/ffffff?text=Fundación+Traesol",
        width: 1200,
        height: 630,
        alt: "Fundación Traesol",
      },
    ],
    locale: "es_CL",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <Navbar />
        {/* Importante: evitar “doble <main>” para no romper estilos del formulario */}
        <div className="min-h-[80vh]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
