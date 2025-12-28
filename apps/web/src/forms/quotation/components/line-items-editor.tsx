'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuotationFormData, LineItemFormData } from '../schema';
import { defaultLineItem } from '../schema';
import { useLineItemCalculations } from '@/hooks/quotation/useLineItemCalculations';

const itemTypes = [
  { value: 'Vehicle', label: 'Vehicle' },
] as const;

export function LineItemsEditor() {
  const form = useFormContext<QuotationFormData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });
  const { calculateNetPrice, calculateDiscountPercentage, calculateDiscountAmount } = useLineItemCalculations();

  const handleAddItem = () => {
    const newLineNumber = fields.length + 1;
    append({
      ...defaultLineItem,
      lineNumber: newLineNumber,
      itemType: 'Vehicle',
    } as LineItemFormData);
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      // Update line numbers
      fields.forEach((_, i) => {
        if (i >= index) {
          form.setValue(`lineItems.${i}.lineNumber`, i + 1);
        }
      });
    }
  };

  // Helper functions to update form values using the calculation hook
  const updateNetPrice = (index: number) => {
    const lineItem = form.getValues(`lineItems.${index}`);
    const netPrice = calculateNetPrice(
      lineItem.quantity,
      lineItem.unitPrice,
      lineItem.discountAmount
    );
    form.setValue(`lineItems.${index}.netPrice`, netPrice);
  };

  const updateDiscountPercentage = (index: number) => {
    const lineItem = form.getValues(`lineItems.${index}`);
    const percentage = calculateDiscountPercentage(
      lineItem.quantity,
      lineItem.unitPrice,
      lineItem.discountAmount
    );
    form.setValue(`lineItems.${index}.discountPercentage`, percentage);
  };

  const updateDiscountAmount = (index: number) => {
    const lineItem = form.getValues(`lineItems.${index}`);
    const amount = calculateDiscountAmount(
      lineItem.quantity,
      lineItem.unitPrice,
      lineItem.discountPercentage
    );
    form.setValue(`lineItems.${index}.discountAmount`, amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Line Items</CardTitle>
        <Button type="button" onClick={handleAddItem} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="grid gap-4">
                {/* Row 1: Item Type, Description, Quantity */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.itemType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {itemTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-7">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.itemDescription`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Item description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 1);
                                updateNetPrice(index);
                                updateDiscountPercentage(index);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Row 2: Unit Price, Discount Amount, Discount %, Net Price, Actions */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price (SAR) *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                                updateNetPrice(index);
                                updateDiscountPercentage(index);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.discountAmount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount (SAR)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              max="0"
                              step="0.01"
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                                updateNetPrice(index);
                                updateDiscountPercentage(index);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.discountPercentage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                                updateDiscountAmount(index);
                                updateNetPrice(index);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.netPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Net Price (SAR)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" readOnly disabled className="bg-muted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Optional Row: Item Code, Manufacturer, Part Number */}
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Additional Details
                  </summary>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.itemCode`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Optional" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.manufacturer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturer</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Optional" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.partNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Part Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Optional" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Optional notes" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </details>
              </div>
            </Card>
          ))}
        </div>

        {fields.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              No line items added yet. Click the button above to add your first item.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
