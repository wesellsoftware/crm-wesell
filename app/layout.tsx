import type { Metadata } from "next"
import { Bree_Serif, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const breeSerif = Bree_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bree-serif",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "WeSell CRM",
  description: "CRM da WeSell — feche mais, mais rápido.",
  icons: {
    icon: "/assets/logo-pequeno.png",
    shortcut: "/assets/logo-pequeno.png",
    apple: "/assets/logo-pequeno.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${breeSerif.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
