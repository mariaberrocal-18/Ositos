import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "Simona y Amelia",
  description: "Historia médica de Simona y Amelia: visitas al vet, vacunas, estudios, remedios, peso y journal.",
  applicationName: "Simona y Amelia",
  appleWebApp: { capable: true, title: "Ositos", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={GeistSans.variable}>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
