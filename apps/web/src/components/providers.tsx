"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { CartProvider } from "@/lib/cart-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <CartProvider>
        {children}
        <Toaster richColors />
      </CartProvider>
    </ThemeProvider>
  );
}
