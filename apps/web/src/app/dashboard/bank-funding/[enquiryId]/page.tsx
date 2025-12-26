"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getEnquiryById } from "@/services/enquiry";
import {
  getFinancingByEnquiryId,
  createFinancing,
  updateFinancing,
  deleteFinancing,
  type Financing,
} from "@/services/financing";
import { Funding } from "@/forms/sales-enquiry/components/funding";

export default function BankFundingPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const enquiryId = parseInt(params.enquiryId as string, 10);

  const [financingSchemes, setFinancingSchemes] = useState<Financing[]>([]);

  const { data: enquiry, isLoading: isLoadingEnquiry } = useQuery({
    queryKey: ["enquiry", enquiryId],
    queryFn: () => getEnquiryById(enquiryId),
    enabled: !!enquiryId && !isNaN(enquiryId),
  });

  const {
    data: schemes,
    isLoading: isLoadingSchemes,
    refetch: refetchSchemes,
  } = useQuery({
    queryKey: ["financing-schemes", enquiryId],
    queryFn: () => getFinancingByEnquiryId(enquiryId),
    enabled: !!enquiryId && !isNaN(enquiryId),
  });

  useEffect(() => {
    if (schemes) {
      setFinancingSchemes(schemes);
    }
  }, [schemes]);

  const createMutation = useMutation({
    mutationFn: (data: any) => createFinancing(data),
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: number; data: any }) => updateFinancing(params.id, params.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFinancing(id),
  });

  const handleAddScheme = async (data: any) => {
    createMutation.mutate(
      {
        enquirySlno: enquiryId,
        ...data,
      },
      {
        onSuccess: () => {
          toast.success("Financing scheme added successfully");
          refetchSchemes();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to add financing scheme");
        },
      }
    );
  };

  const handleUpdateScheme = async (id: number, data: any) => {
    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          toast.success("Financing scheme updated successfully");
          refetchSchemes();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to update financing scheme");
        },
      }
    );
  };

  const handleDeleteScheme = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    refetchSchemes();
  };

  const handleBack = () => {
    router.push("/dashboard/sales-enquiry");
  };

  if (isLoadingEnquiry || isLoadingSchemes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
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
            financingSchemes={financingSchemes}
            onAddScheme={handleAddScheme}
            onUpdateScheme={handleUpdateScheme}
            onDeleteScheme={handleDeleteScheme}
          />
        </CardContent>
      </Card>
    </div>
  );
}
