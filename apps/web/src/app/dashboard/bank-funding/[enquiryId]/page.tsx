"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { queryKeys } from "@/lib/query-keys";
import { getEnquiryById } from "@/services/enquiry";
import { Funding } from "@/forms/sales-enquiry/components/funding";
import { useFinancingSchemes } from "@/hooks/entities/useFinancingSchemes";
import { useFinancingMutations } from "@/hooks/entities/useFinancingMutations";
import { LoadingState } from "@/components/shared/loading-state";

export default function BankFundingPage() {
  const params = useParams();
  const router = useRouter();
  const enquiryId = parseInt(params.enquiryId as string, 10);

  // Fetch enquiry details
  const { data: enquiry, isLoading: isLoadingEnquiry } = useQuery({
    queryKey: queryKeys.enquiries.detail(enquiryId),
    queryFn: () => getEnquiryById(enquiryId),
    enabled: !!enquiryId && !isNaN(enquiryId),
  });

  // Use custom hooks for financing schemes
  const { schemes, isLoading: isLoadingSchemes } = useFinancingSchemes(enquiryId);
  const { createScheme, updateScheme, deleteScheme, isCreating, isUpdating } =
    useFinancingMutations(enquiryId);

  const handleBack = () => {
    router.push("/dashboard/sales-enquiry");
  };

  if (isLoadingEnquiry || isLoadingSchemes) {
    return <LoadingState message="Loading bank funding..." />;
  }

  if (!enquiry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Enquiry not found</p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Enquiries
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bank Funding</h1>
            <p className="text-sm text-muted-foreground">
              Manage financing schemes for enquiry #{enquiry.SLNO}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Enquiry Details</CardTitle>
            <Badge variant={enquiry.STATUS === "Active" ? "default" : "secondary"}>
              {enquiry.STATUS}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{enquiry.CUSTOMERNAME}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vehicle</p>
              <p className="font-medium">
                {enquiry.MAKE} {enquiry.MODEL}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Budget</p>
              <p className="font-medium">
                {enquiry.BUDGET ? `${parseFloat(enquiry.BUDGET).toLocaleString()} SAR` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Salesperson</p>
              <p className="font-medium">{enquiry.SALESPERSON}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Financing Schemes</CardTitle>
        </CardHeader>
        <CardContent>
          <Funding
            enquiryId={enquiryId}
            financingSchemes={schemes}
            onAddScheme={createScheme}
            onUpdateScheme={updateScheme}
            onDeleteScheme={deleteScheme}
            isSavingScheme={isCreating || isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  );
}
