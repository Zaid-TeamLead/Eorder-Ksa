"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FinanceSchemeDialog } from "./finance-scheme-dialog";
import { useLenders } from "@/hooks/entities/useLenders";
import { useCurrencies } from "@/hooks/entities/useCurrencies";
import { useSalesEmployees } from "@/hooks/entities/useSalesEmployees";
import type { Financing } from "@/services/financing";
import { toast } from "sonner";

interface FundingProps {
  enquiryId?: number;
  financingSchemes: Financing[];
  onAddScheme: (data: any) => Promise<void>;
  onUpdateScheme: (id: number, data: any) => Promise<void>;
  onDeleteScheme: (id: number) => Promise<void>;
  isSavingScheme?: boolean;
}

export function Funding({
  enquiryId,
  financingSchemes,
  onAddScheme,
  onUpdateScheme,
  onDeleteScheme,
  isSavingScheme = false,
}: FundingProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Financing | null>(null);

  // Use custom hook to load lenders
  const { lenders } = useLenders();
  const { currencies } = useCurrencies();
  const { salesEmployees } = useSalesEmployees();

  const handleAdd = () => {
    setEditingScheme(null);
    setDialogOpen(true);
  };

  const handleEdit = (scheme: Financing) => {
    setEditingScheme(scheme);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (editingScheme) {
      await onUpdateScheme(editingScheme.SLNO, data);
      return;
    }

    await onAddScheme(data);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this financing scheme?")) {
      try {
        await onDeleteScheme(id);
        toast.success("Financing scheme deleted successfully");
      } catch (error) {
        toast.error("Failed to delete financing scheme");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Financing Schemes</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {financingSchemes.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 border rounded-md">
          No finance schemes added
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lender</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">FDA</TableHead>
              <TableHead className="text-right">Payment</TableHead>
              <TableHead className="text-right">GPV/Balloon</TableHead>
              <TableHead className="text-center">Preferred</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financingSchemes.map((scheme) => (
              <TableRow key={scheme.SLNO}>
                <TableCell className="font-medium">{scheme.LENDER_NAME}</TableCell>
                <TableCell>{scheme.CURRENCY || "N/A"}</TableCell>
                <TableCell>{scheme.LENDER_NAME}</TableCell>
                <TableCell className="text-right">
                  {scheme.FDA != null ? Number(scheme.FDA).toFixed(2) : "0.00"}
                </TableCell>
                <TableCell className="text-right">
                  {scheme.MONTHLY_PAYMENT != null ? Number(scheme.MONTHLY_PAYMENT).toFixed(2) : "0.00"}
                </TableCell>
                <TableCell className="text-right">
                  {scheme.GPV_BALLOON != null ? Number(scheme.GPV_BALLOON).toFixed(2) : "0.00"}
                </TableCell>
                <TableCell className="text-center">
                  {scheme.IS_SELECTED === "Y" ? "✓" : ""}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(scheme)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(scheme.SLNO)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <FinanceSchemeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lenders={lenders}
        currencies={currencies}
        salesEmployees={salesEmployees}
        onSubmit={handleSubmit}
        initialData={editingScheme}
        isSubmitting={isSavingScheme}
      />
    </div>
  );
}
