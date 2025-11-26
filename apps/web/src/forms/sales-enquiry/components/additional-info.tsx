"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SalesEnquiryFormData } from "../schema";
import { useCart } from "@/lib/cart-context";
import { Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export function AdditionalInfo() {
  const form = useFormContext<SalesEnquiryFormData>();
  const { items, removeItem, getTotalPrice, clearCart } = useCart();
  const totalPrice = getTotalPrice();
  const currency = items[0]?.currency || "SAR";
  const session = useSession();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="salesperson"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium">
                Assigned Salesperson
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Salesperson name"
                  className="h-7 text-xs"
                  {...field}
                  value={field.value || session?.data?.user.name || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={!!field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium">
              Notes / Comments
            </FormLabel>
            <FormControl>
              <textarea
                rows={4}
                placeholder="Any additional notes or comments..."
                className={cn(
                  "text-sm resize-none",
                  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-2.5 py-1.5 shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2",
                  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                )}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Cart Summary */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Order Summary</h3>
          {items.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="h-7 text-xs"
            >
              Clear Cart
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No items in cart. Add vehicles from the Vehicle Details tab.
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs">Item</TableHead>
                    <TableHead className="h-8 text-xs">Variant</TableHead>
                    <TableHead className="h-8 text-xs">Color</TableHead>
                    <TableHead className="h-8 text-xs text-center">Qty</TableHead>
                    <TableHead className="h-8 text-xs text-right">Unit Price</TableHead>
                    <TableHead className="h-8 text-xs text-right">Total</TableHead>
                    <TableHead className="h-8 text-xs w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    // Use discPrice if available, otherwise use price
                    const priceStr = item.discPrice || item.price;
                    const unitPrice = priceStr ? parseFloat(priceStr) : 0;
                    const itemTotal = unitPrice * item.quantity;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs py-2">
                          <div>
                            <div className="font-medium">{item.itemName}</div>
                            {item.vinNumber && (
                              <div className="text-muted-foreground text-[10px] mt-0.5">
                                VIN: {item.vinNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          {item.variant || item.itemCode}
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          {item.color || "-"}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right">
                          {unitPrice > 0 ? (
                            <>
                              {item.discPrice && item.price && parseFloat(item.price) > parseFloat(item.discPrice) && (
                                <div className="text-muted-foreground line-through text-[10px]">
                                  {parseFloat(item.price).toLocaleString()} {item.currency}
                                </div>
                              )}
                              <div>
                                {unitPrice.toLocaleString()} {item.currency || currency}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right font-medium">
                          {itemTotal > 0 ? (
                            `${itemTotal.toLocaleString()} ${item.currency || currency}`
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Items:</span>
                  <span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total Amount:</span>
                  <span>
                    {totalPrice > 0 ? (
                      `${totalPrice.toLocaleString()} ${currency}`
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
