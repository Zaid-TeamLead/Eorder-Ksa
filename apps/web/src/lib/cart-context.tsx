"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
    id: string;
    itemCode: string;
    itemName: string;
    make: string;
    model: string;
    variant?: string;
    year?: string;
    color?: string;
    suppCatNum?: string;
    modelCode?: string;
    quantity: number;
    available: number;
    price?: string;
    currency?: string;
    discPrice?: string;
    vinNumber?: string;
    customerName?: string;
    mobile?: string;
    email?: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem("salesEnquiryCart");
                if (stored) {
                    setItems(JSON.parse(stored));
                }
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("salesEnquiryCart", JSON.stringify(items));
        }
    }, [items]);

    const addItem = (item: CartItem) => {
        setItems((prev) => {
            // Check if item already exists by VIN number only
            // Each VIN should have its own quantity, independent of item code
            const existingIndex = prev.findIndex((i) =>
                i.vinNumber && item.vinNumber && i.vinNumber === item.vinNumber
            );
            if (existingIndex >= 0) {
                // Replace quantity for the same VIN (user explicitly set the quantity)
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: item.quantity, // Use the new quantity directly
                };
                return updated;
            }
            // Add new item
            return [...prev, item];
        });
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const clearCart = () => {
        setItems([]);
    };

    const getTotalItems = () => {
        return items.reduce((sum, item) => sum + item.quantity, 0);
    };

    const getTotalPrice = () => {
        return items.reduce((sum, item) => {
            const price = parseFloat(item.discPrice || item.price || "0");
            return sum + price * item.quantity;
        }, 0);
    };

    return (
        <CartContext.Provider
            value={{ items, addItem, removeItem, clearCart, getTotalItems, getTotalPrice }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

