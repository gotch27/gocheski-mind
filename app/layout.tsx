import type { Metadata } from "next";
import { headers } from "next/headers";
import { Outfit } from "next/font/google";
import type { ReactNode } from "react";
import { appBasePath } from "@/lib/base-path";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit"
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    applicationName: "Gocheski Mind",
    title: "Gocheski Mind — Your visual archive",
    description: "A quiet, private place for the ideas, images, notes, and links worth keeping.",
    openGraph: {
      type: "website",
      title: "Gocheski Mind",
      description: "Keep what moves you.",
      images: [{ url: `${appBasePath}/og.jpg`, width: 1200, height: 630, alt: "Gocheski Mind — Keep what moves you." }]
    },
    twitter: {
      card: "summary_large_image",
      title: "Gocheski Mind",
      description: "Keep what moves you.",
      images: [`${appBasePath}/og.jpg`]
    },
    robots: {
      index: false,
      follow: false
    }
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.variable}>{children}</body>
    </html>
  );
}
