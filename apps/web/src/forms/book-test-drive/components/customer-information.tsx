"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare, FileText } from "lucide-react";
import type { SalesEnquiryFormData } from "../schema";

export function CustomerInformation() {
  const form = useFormContext<SalesEnquiryFormData>();

  return (
    <div className="flex flex-col gap-4">
      {/* Customer Details - Compact Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Basic Info */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Name</FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Address</FormLabel>
                <FormControl>
                  <textarea
                    rows={2}
                    className={cn(
                      "text-sm h-16 resize-none",
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
          <FormField
            control={form.control}
            name="postcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Postcode</FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-1.5 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 flex-1"
            >
              <Mail className="w-3 h-3 mr-1" />
              Email
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 flex-1"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              SMS
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 flex-1"
            >
              <FileText className="w-3 h-3 mr-1" />
              Letter
            </Button>
          </div>
        </div>

        {/* Middle Column - Contact Information */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="homePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Home Phone
                </FormLabel>
                <FormControl>
                  <Input type="tel" className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Work Phone
                </FormLabel>
                <FormControl>
                  <Input type="tel" className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Mobile <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="tel" className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="homeEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Home Email
                </FormLabel>
                <FormControl>
                  <Input type="email" className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Work Email
                </FormLabel>
                <FormControl>
                  <Input type="email" className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Right Column - Additional Details */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="previousName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Previous Name
                </FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Job Title</FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyPosition"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Company Position
                </FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Business Type
                </FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sourceOfInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Source of Info
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">
                    Date of Birth
                  </FormLabel>
                  <FormControl>
                    <Input type="date" className="h-8 text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
