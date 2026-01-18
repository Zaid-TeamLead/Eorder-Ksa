import type { Metadata } from "next";
import { Merriweather, Montserrat, Source_Code_Pro } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";

const sans = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
});

const serif = Merriweather({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "keylooppro",
  description: "keylooppro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${mono.variable} ${serif.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="grid grid-rows-[auto_1fr] h-svh">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
