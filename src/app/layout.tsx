import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { initializeServices } from "@/lib/startup/init-services";
import { auth } from "@/lib/auth/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VIS HR Portal",
  description: "Human Resource Management System",
};

// Initialize background services
if (typeof window === 'undefined') {
  initializeServices();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get session server-side to pass to SessionProvider
  const session = await auth();

  console.log('🏗️ [LAYOUT] Root layout rendering (server-side session)', session ? `User: ${session.user?.username}` : 'No session');

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
