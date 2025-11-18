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
            // Check if item already exists (by itemCode)
            const existingIndex = prev.findIndex((i) => i.itemCode === item.itemCode);
            if (existingIndex >= 0) {
                // Update quantity if exists
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + item.quantity,
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

    return (
        <CartContext.Provider
            value={{ items, addItem, removeItem, clearCart, getTotalItems }}
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

