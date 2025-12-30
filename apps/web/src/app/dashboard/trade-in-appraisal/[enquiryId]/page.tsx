"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getEnquiryById } from "@/services/enquiry";
import {
  getTradeInAppraisalByEnquiryId,
  createTradeInAppraisal,
  updateTradeInAppraisal,
  type TradeInAppraisal,
} from "@/services/tradeInAppraisal";
import {
  tradeInAppraisalSchema,
  type TradeInAppraisalFormData,
} from "@/forms/trade-in-appraisal/schema";
import { TradeInFormFields } from "@/forms/trade-in-appraisal/components/form-fields";
import { RequestAppraisalDialog } from "@/forms/sales-enquiry/components/request-appraisal-dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { ButtonLoading } from "@/components/shared/button-loading";

export default function TradeInAppraisalPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const enquiryId = parseInt(params.enquiryId as string, 10);

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [appraisalId, setAppraisalId] = useState<number | null>(null);

  // Fetch enquiry details
  const { data: enquiry, isLoading: isLoadingEnquiry } = useQuery({
    queryKey: ["enquiry", enquiryId],
    queryFn: () => getEnquiryById(enquiryId),
    enabled: !!enquiryId && !isNaN(enquiryId),
  });

  // Fetch existing appraisal (if any)
  const {
    data: appraisal,
    isLoading: isLoadingAppraisal,
    refetch: refetchAppraisal,
  } = useQuery({
    queryKey: ["trade-in-appraisal", enquiryId],
    queryFn: () => getTradeInAppraisalByEnquiryId(enquiryId),
    enabled: !!enquiryId && !isNaN(enquiryId),
  });

  // Initialize form
  const form = useForm<TradeInAppraisalFormData>({
    resolver: zodResolver(tradeInAppraisalSchema),
    defaultValues: {
      registrationNumber: "",
      vin: "",
      manufacturer: "",
      model: "",
      variant: "",
      description: "",
      colour: "",
      trim: "",
      bodyStyle: "",
      transmission: "",
      fuelType: "",
      engineSize: "",
      numberOfDoors: "",
      registrationDate: "",
      odometerReading: "",
      customerExpectedPrice: "",
      marketValue: "",
      appraisalOffer: "",
    },
  });

  // Populate form when appraisal data is loaded
  useEffect(() => {
    if (appraisal) {
      setAppraisalId(appraisal.SLNO);
      form.reset({
        registrationNumber: appraisal.REGISTRATION_NUMBER || "",
        vin: appraisal.VIN || "",
        manufacturer: appraisal.MANUFACTURER || "",
        model: appraisal.MODEL || "",
        variant: appraisal.VARIANT || "",
        description: appraisal.DESCRIPTION || "",
        colour: appraisal.COLOUR || "",
        trim: appraisal.TRIM || "",
        bodyStyle: appraisal.BODY_STYLE || "",
        transmission: appraisal.TRANSMISSION || "",
        fuelType: appraisal.FUEL_TYPE || "",
        engineSize: appraisal.ENGINE_SIZE || "",
        numberOfDoors: appraisal.NUMBER_OF_DOORS || "",
        registrationDate: appraisal.REGISTRATION_DATE || "",
        odometerReading: appraisal.ODOMETER_READING || "",
        customerExpectedPrice: appraisal.CUSTOMER_EXPECTED_PRICE || "",
        marketValue: appraisal.MARKET_VALUE || "",
        appraisalOffer: appraisal.APPRAISAL_OFFER || "",
      });
    }
  }, [appraisal, form]);

  // Create appraisal mutation
  const createMutation = useMutation({
    mutationFn: createTradeInAppraisal,
    onSuccess: (data) => {
      toast.success("Trade-in appraisal saved successfully");
      setAppraisalId(data.id);
      queryClient.invalidateQueries({
        queryKey: ["trade-in-appraisal", enquiryId],
      });
      refetchAppraisal();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to save trade-in appraisal"
      );
    },
  });

  // Update appraisal mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateTradeInAppraisal(id, data),
    onSuccess: () => {
      toast.success("Trade-in appraisal updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["trade-in-appraisal", enquiryId],
      });
      refetchAppraisal();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update trade-in appraisal"
      );
    },
  });

  // Handle form submission
  const onSubmit = (data: TradeInAppraisalFormData) => {
    const payload = {
      enquirySlno: enquiryId,
      registrationNumber: data.registrationNumber,
      vin: data.vin,
      manufacturer: data.manufacturer,
      model: data.model,
      variant: data.variant,
      description: data.description,
      colour: data.colour,
      trim: data.trim,
      bodyStyle: data.bodyStyle,
      transmission: data.transmission,
      fuelType: data.fuelType,
      engineSize: data.engineSize,
      numberOfDoors: data.numberOfDoors,
      registrationDate: data.registrationDate,
      odometerReading: data.odometerReading,
      customerExpectedPrice: data.customerExpectedPrice,
      marketValue: data.marketValue,
      appraisalOffer: data.appraisalOffer,
    };

    if (appraisalId) {
      // Update existing appraisal
      updateMutation.mutate({ id: appraisalId, data: payload });
    } else {
      // Create new appraisal
      createMutation.mutate(payload);
    }
  };

  const isLoading = isLoadingEnquiry || isLoadingAppraisal;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleRequestAppraisal = () => {
    if (!appraisalId) {
      toast.error("Please save the appraisal first");
      return;
    }
    setRequestDialogOpen(true);
  };

  const handleRequestSuccess = () => {
    refetchAppraisal();
  };

  if (isLoading) {
    return <LoadingState message="Loading trade-in appraisal..." />;
  }

  if (!enquiry) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Enquiry not found</p>
          <Button onClick={() => router.push("/dashboard/sales-enquiry")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Enquiries
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/sales-enquiry")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Enquiries
        </Button>


        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Trade-In Appraisal
            </h1>
            <p className="text-muted-foreground mt-1">
              Enquiry #{enquiry.SLNO} • {enquiry.CUSTOMERNAME || "Unknown Customer"}
            </p>
          </div>

          {appraisal?.APPRAISAL_STATUS && (
            <Badge
              variant={
                appraisal.APPRAISAL_STATUS === "Pending" ||
                appraisal.APPRAISAL_STATUS === "InProgress"
                  ? "secondary"
                  : appraisal.APPRAISAL_STATUS === "Completed" ||
                    appraisal.APPRAISAL_STATUS === "Approved"
                  ? "default"
                  : "destructive"
              }
              className="text-sm px-3 py-1"
            >
              {appraisal.APPRAISAL_STATUS}
            </Badge>
          )}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Enquiry Context Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Enquiry Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <p className="font-medium">{enquiry.CUSTOMERNAME || "N/A"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mobile:</span>
              <p className="font-medium">{enquiry.MOBILE || "N/A"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Vehicle:</span>
              <p className="font-medium">
                {enquiry.MAKENAME} {enquiry.MODELNAME} {enquiry.VARIANTNAME || ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appraisal Form */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TradeInFormFields form={form} appraisal={appraisal} />

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="min-w-[120px]"
                  >
                    {isSaving ? (
                      <ButtonLoading text="Saving..." />
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {appraisalId ? "Update" : "Save"}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRequestAppraisal}
                    disabled={!appraisalId || isSaving}
                    className="min-w-[180px]"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Request Appraisal
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/dashboard/sales-enquiry")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Request Appraisal Dialog */}
      <RequestAppraisalDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        appraisalId={appraisalId}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
}
