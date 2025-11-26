"use client";
import { use, useState, useRef } from "react";
import { DataTable } from "@/components/data-table";
import data from "../data.json";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BookTestDriveForm, {
  type BookTestDriveFormData,
} from "@/forms/book-test-drive";

export default function BookTestDrive({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const params = use(searchParams);
  const action = params.action;
  const [isCreate, setIsCreate] = useState(action === "create");
  const formRef = useRef<{ submit: () => void }>(null);

  const handleSubmit = async (data: BookTestDriveFormData) => {
    console.log("Form data:", data);
    // Handle form submission here
    setIsCreate(false);
  };

  const handleNewEnquiry = () => {
    setIsCreate(true);
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <DataTable data={data} onNewEnquiry={handleNewEnquiry} buttonName="Book Test Drive" />
      <Dialog
        open={isCreate}
        onOpenChange={(open) => {
          setIsCreate(open);
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] w-full h-full flex flex-col sm:max-w-4xl p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Book Test Drive</DialogTitle>
            <DialogDescription>Fill in all the required information to book a test drive</DialogDescription>
          </DialogHeader>
          <BookTestDriveForm ref={formRef} onSubmit={handleSubmit} />
          <DialogFooter className="mt-auto border-t px-6 py-3 flex items-center justify-between bg-muted/30">
            <div className="flex gap-2"></div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                size="sm"
                className="h-8"
                onClick={() => formRef.current?.submit()}
              >
                Book Test Drive
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
