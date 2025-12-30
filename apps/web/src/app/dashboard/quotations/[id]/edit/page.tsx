'use client';

import { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
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
import { LineItemsEditor } from '@/forms/quotation/components/line-items-editor';
import { PricingSummary } from '@/forms/quotation/components/pricing-summary';
import { quotationFormSchema, defaultQuotationFormValues, type QuotationFormData } from '@/forms/quotation/schema';

// Shared components
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';

// Custom hooks
import { useQuotationById } from '@/hooks/entities/useQuotations';
import { useQuotationMutations } from '@/hooks/entities/useQuotationMutations';

// Utilities
import { transformQuotationToFormData, validateFormDataForNaN } from '@/forms/quotation/utils/transformQuotationToFormData';

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = parseInt(params.id as string, 10);

  const { quotation, isLoading, error } = useQuotationById(quotationId);
  const { updateQuotation, isUpdating } = useQuotationMutations();

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: defaultQuotationFormValues,
  });

  // Load quotation data into form
  // Using useCallback to memoize the reset function
  const resetForm = useCallback((quotationData: typeof quotation) => {
    if (quotationData) {
      const formData = transformQuotationToFormData(quotationData);
      form.reset(formData);
    }
  }, [form]);

  useEffect(() => {
    resetForm(quotation);
  }, [quotation, resetForm]);

  // Handle form submission
  const handleSave = useCallback(async (data: QuotationFormData) => {
    try {
      // Remove enquirySlno from update payload (it's immutable)
      const { enquirySlno, ...updateData } = data;

      // Development-only: Validate form data for NaN values
      validateFormDataForNaN(updateData);

      await updateQuotation(quotationId, updateData);
      router.push(`/dashboard/quotations/${quotationId}`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to update quotation. Please try again.';
      toast.error(errorMessage);

      // Log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating quotation:', error);
      }
    }
  }, [quotationId, updateQuotation, router]);

  // Handle validation errors
  const handleValidationError = useCallback((errors: any) => {
    // Log validation errors in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Form validation errors:', errors);
    }

    if (!errors || Object.keys(errors).length === 0) {
      toast.error('Please check the form for errors');
      return;
    }

    // Show the first error to the user
    const firstErrorKey = Object.keys(errors)[0];
    const firstError = errors[firstErrorKey];
    const message = firstError?.message || 'Please check the form for errors';
    toast.error(message);
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading quotation..." />;
  }

  if (error || !quotation) {
    return (
      <ErrorState
        title="Quotation Not Found"
        message="The quotation you're trying to edit doesn't exist or you don't have permission to edit it."
      />
    );
  }

  // Check if quotation can be edited
  if (quotation.STATUS !== 'Draft' && quotation.STATUS !== 'Pending') {
    return (
      <ErrorState
        title="Cannot Edit Quotation"
        message={`This quotation has status "${quotation.STATUS}" and cannot be edited. Only Draft or Pending quotations can be edited.`}
      />
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Quotation</h1>
        <p className="text-muted-foreground">
          {quotation.QUOTATION_NUMBER} - {quotation.CUSTOMER_NAME}
        </p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Update customer details if needed</CardDescription>
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
                        <Input {...field} placeholder="Vehicle make" />
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
                        <Input {...field} placeholder="Vehicle model" />
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
                        <Input {...field} placeholder="Vehicle variant" />
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
                        <Input {...field} placeholder="Year" />
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
                <Button
                  type="button"
                  onClick={form.handleSubmit(handleSave, handleValidationError)}
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
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
