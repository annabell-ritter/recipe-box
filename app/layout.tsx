import type { Metadata } from "next";
import { Cal_Sans, Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Recipe Box",
  description: "Keep your own private recipes.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

// Display font for the large page titles and the wordmark; everything else is Geist.
const calSans = Cal_Sans({
  variable: "--font-display",
  weight: "400",
  display: "swap",
  subsets: ["latin"],
  // Next.js has no size metrics for Cal Sans, so it cannot build a matched
  // fallback font and would warn on every compile. Use a plain fallback instead.
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${calSans.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
