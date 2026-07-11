import { Geist, Geist_Mono } from "next/font/google"
import "@fontsource/momo-trust-display"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider, AnchoredToastProvider } from "@/components/ui/toast"
import type { Metadata } from 'next';
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { default: 'Luma', template: '%s - Luma' },
  description: 'Discover, document, and monitor every service running on your infrastructure.',
};

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", "font-sans", geistSans.variable, geistMono.variable)}
    >
      <head>
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="relative">
        <ThemeProvider>
          <ToastProvider>
            <AnchoredToastProvider>
              <div className="isolate relative flex min-h-svh flex-col">{children}</div>
            </AnchoredToastProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
