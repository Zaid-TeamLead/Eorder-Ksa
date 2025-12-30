"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { requestAppraisal } from "@/services/tradeInAppraisal";
import { logger } from '@/lib/logger';

interface RequestAppraisalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appraisalId: number | null;
  onSuccess?: () => void;
}

// Mock user list - Replace with actual user fetching logic
const APPRAISERS = [
  { id: "user1", name: "Mark Andersson", role: "Senior Appraiser" },
  { id: "user2", name: "Sarah Johnson", role: "Vehicle Appraiser" },
  { id: "user3", name: "John Smith", role: "Lead Appraiser" },
  { id: "user4", name: "Emma Davis", role: "Vehicle Specialist" },
];

export function RequestAppraisalDialog({
  open,
  onOpenChange,
  appraisalId,
  onSuccess,
}: RequestAppraisalDialogProps) {
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [requestNotes, setRequestNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = () => {
    setAssignedTo("");
    setRequestNotes("");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!assignedTo) {
      toast.error("Please select an appraiser");
      return;
    }

    if (!appraisalId) {
      toast.error("Invalid appraisal ID");
      return;
    }

    try {
      setIsSubmitting(true);

      await requestAppraisal(appraisalId, {
        assignedTo,
        requestNotes: requestNotes || undefined,
      });

      toast.success("Appraisal request sent successfully");
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      logger.error("Error requesting appraisal:", error);
      toast.error(
        error.response?.data?.message || "Failed to send appraisal request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Trade-in Appraisal</DialogTitle>
          <DialogDescription>
            Assign this trade-in vehicle to an appraiser for evaluation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Appraiser Selection */}
          <div className="grid gap-2">
            <Label htmlFor="assignedTo">
              Assign to Appraiser <span className="text-destructive">*</span>
            </Label>
            <Select
              value={assignedTo}
              onValueChange={setAssignedTo}
              disabled={isSubmitting}
            >
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Select an appraiser..." />
              </SelectTrigger>
              <SelectContent>
                {APPRAISERS.map((appraiser) => (
                  <SelectItem key={appraiser.id} value={appraiser.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{appraiser.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {appraiser.role}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Request Notes */}
          <div className="grid gap-2">
            <Label htmlFor="requestNotes">Request Notes (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Provide details about the vehicle condition, urgency, or any
              specific areas to focus on.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !assignedTo}
          >
            {isSubmitting ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
