import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nivaaran.ai — Bengaluru Traffic Congestion Intelligence",
  description: "Event-driven congestion prediction and resource dispatch powered by a 3-model ML ensemble.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#FAFAFA] text-[#111111] min-h-screen`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
