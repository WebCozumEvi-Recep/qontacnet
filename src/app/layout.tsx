import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"], variable: "--inter" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--sora" });

export const metadata: Metadata = {
  title: "QONTAC Network Card | Akıllı Dijital Kartvizit Sistemi",
  description:
    "QONTAC Network Card ile üyelerinize NFC ve QR destekli, firma onaylı, kişiselleştirilebilir dijital temsilci sayfaları sunun.",
  keywords: "NFC kartvizit, dijital kartvizit, network marketing, QR kod kartvizit",
  openGraph: {
    title: "QONTAC Network Card",
    description: "Network ekipleriniz için akıllı dijital kartvizit sistemi.",
    url: "https://qontac.net",
    siteName: "QONTAC",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark scroll-smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={`${inter.variable} ${sora.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
