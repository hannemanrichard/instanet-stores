import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/shared/components/ThemeProvider";
import { ConditionalClerkProvider } from "@/shared/components/providers/ConditionalClerkProvider";
import { ReactQueryProvider } from "@/shared/lib/providers/react-query";
import { I18nProvider } from "@/shared/lib/providers/i18n-provider";
import { Toaster } from "@/shared/components/ui/toaster";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";
import { PixelScripts } from "@/shared/components/PixelScripts";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/shared/lib/brand";
import { Cairo, IBM_Plex_Mono, Inter, Playfair_Display } from "next/font/google";

/** Non-Arabic UI face — Inter */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Optional editorial serif — Playfair Display */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

/** Mono — IBM Plex Mono */
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

/** Arabic UI face — used for all text when lang=ar */
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${BRAND_NAME}`,
    default: BRAND_NAME,
  },
  description: `${BRAND_NAME} - manage your store, products, and orders`,
  icons: {
    icon: [{ url: BRAND_LOGO_SRC, type: "image/svg+xml" }],
    shortcut: BRAND_LOGO_SRC,
    apple: BRAND_LOGO_SRC,
  },
  other: {
    "facebook-domain-verification": "3oy9d69km6868q0wrj4g6900b9ptzt",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head />
      <body
        className={`${inter.variable} ${playfair.variable} ${ibmPlexMono.variable} ${cairo.variable} font-sans`}
      >
        <ConditionalClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <I18nProvider>
              <ReactQueryProvider>
                <NextSSRPlugin
                  routerConfig={extractRouterConfig(ourFileRouter)}
                />
                <PixelScripts />
                {children}
              </ReactQueryProvider>
            </I18nProvider>
          </ThemeProvider>
        </ConditionalClerkProvider>
        <Toaster />
      </body>
    </html>
  );
}
