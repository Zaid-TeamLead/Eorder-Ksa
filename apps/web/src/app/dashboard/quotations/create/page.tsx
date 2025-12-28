'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { LineItemsEditor } from '@/forms/quotation/components/line-items-editor';
import { PricingSummary } from '@/forms/quotation/components/pricing-summary';
import { quotationFormSchema, defaultQuotationFormValues, type QuotationFormData } from '@/forms/quotation/schema';

// Shared components
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';

// Custom hooks
import { useQuotationFormData } from '@/hooks/quotation/useQuotationFormData';
import { useQuotationFormSubmit } from '@/hooks/quotation/useQuotationFormSubmit';

export default function CreateQuotationPage() {
  const searchParams = useSearchParams();
  const enquiryId = searchParams.get('enquiryId');
  const supersedeId = searchParams.get('supersede');

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: defaultQuotationFormValues,
  });

  // Load form data from enquiry or parent quotation
  const {
    isLoading,
    enquiry,
    parentQuotation,
    error,
    isSuperseding,
  } = useQuotationFormData({
    enquiryId,
    supersedeId,
    onDataLoaded: (data) => form.reset(data),
  });

  // Handle form submission
  const { handleSaveAsDraft, handleSaveAndSend, isCreating } = useQuotationFormSubmit({
    isSuperseding,
    supersedeId,
  });

  if (isLoading) {
    return (
      <LoadingState
        message={isSuperseding ? 'Loading quotation data...' : 'Loading enquiry data...'}
      />
    );
  }

  if (!enquiry && !parentQuotation) {
    return (
      <ErrorState
        title={isSuperseding ? 'Quotation Not Found' : 'Enquiry Not Found'}
        message={
          isSuperseding
            ? "The quotation you're trying to supersede doesn't exist."
            : "The enquiry you're looking for doesn't exist."
        }
      />
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isSuperseding ? 'Create New Version' : 'Create Quotation'}
          </h1>
          <p className="text-muted-foreground">
            {isSuperseding && parentQuotation
              ? `Creating new version of ${parentQuotation.QUOTATION_NUMBER}`
              : enquiry && `For Enquiry: ${enquiry.CUSTOMERNAME} - ${enquiry.MAKE} ${enquiry.MODEL}`}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      <FormProvider {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Pre-filled from enquiry, editable if needed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Customer name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mobile number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Customer address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>Pre-filled from enquiry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleMake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Vehicle make" readOnly className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Vehicle model" readOnly className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleVariant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variant</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Vehicle variant" readOnly className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Year" readOnly className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vinNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="VIN number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Supersede Reason (only shown when creating new version) */}
          {isSuperseding && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle>Reason for New Version</CardTitle>
                <CardDescription>
                  Explain why you're creating a new version of this quotation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="supersedeReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Explain why you're creating a new version (minimum 10 characters)..."
                        />
                      </FormControl>
                      <FormDescription>
                        This will be logged in the activity history
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Line Items */}
          <LineItemsEditor />

          {/* Pricing Summary */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              {/* Additional Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormDescription>
                          Set the expiration date for this quotation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Visible to Customer)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Customer-visible notes..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termsAndConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms & Conditions</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={5} placeholder="Terms and conditions..." />
                        </FormControl>
                        <FormDescription>
                          Will be printed on the quotation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="internalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Internal notes (not visible to customer)..." />
                        </FormControl>
                        <FormDescription>
                          For internal use only, not printed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="col-span-1">
              <PricingSummary />
            </div>
          </div>

          {/* Form Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveAsDraft} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
                <Button type="button" onClick={handleSaveAndSend} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Save & Send
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hidden field for enquiry ID */}
          <input type="hidden" {...form.register('enquirySlno')} />
        </form>
      </FormProvider>
    </div>
  );
}
