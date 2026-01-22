import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import InitializationProvider from "@/components/InitializationProvider";
import GlobalEffectsWrapper from "@/components/effects/GlobalEffectsWrapper";

import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TheCodePrism | Software Engineering Excellence",
  description: "Bespoke digital solutions with specialized mobile-authenticated CMS. Crafting premium web and mobile experiences.",
  keywords: ["Software Engineer", "React", "Portfolio", "Tesseract", "4D Animation"],
  authors: [{ name: "TheCodePrism Team" }],
  openGraph: {
    title: "TheCodePrism - Engineering Perfection",
    description: "Premium technical portfolio with advanced 4D visualizations.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TheCodePrism - Engineering Perfection",
    description: "Premium technical portfolio with advanced 4D visualizations.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="no-scrollbar">
      <body className={inter.className}>
        <ThemeProvider>
          <InitializationProvider>
            {/* Global Visual Effects Control */}
            <GlobalEffectsWrapper />

            <main id="lensing-substrate" className="relative z-10">
              {children}
            </main>
          </InitializationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
