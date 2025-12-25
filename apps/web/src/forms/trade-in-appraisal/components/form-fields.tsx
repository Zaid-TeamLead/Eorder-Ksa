"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TradeInAppraisal } from "@/services/tradeInAppraisal";

// Dropdown options
const BODY_STYLES = [
  "Sedan",
  "Coupe",
  "SUV",
  "Crossover",
  "Hatchback",
  "Wagon",
  "Van",
  "Truck",
  "Convertible",
];

const TRANSMISSIONS = [
  "Manual",
  "Automatic",
  "Semi-Automatic",
  "CVT",
  "DSG",
];

const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "CNG"];

const COLOURS = [
  "Black",
  "White",
  "Silver",
  "Grey",
  "Blue",
  "Red",
  "Green",
  "Brown",
  "Beige",
  "Gold",
  "Orange",
  "Yellow",
];

const TRIMS = ["Fabric", "Leather", "Alcantara", "Vinyl"];

const DOORS = ["2", "3", "4", "5"];

interface TradeInFormFieldsProps {
  form: UseFormReturn<any>;
  appraisal?: TradeInAppraisal | null;
}

export function TradeInFormFields({ form, appraisal }: TradeInFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Vehicle Identification Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          Vehicle Identification
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Registration Number
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-8 text-sm"
                    placeholder="e.g., ABC1234"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">VIN</FormLabel>
                <FormControl>
                  <Input
                    className="h-8 text-sm"
                    placeholder="Vehicle Identification Number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Manufacturer
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-8 text-sm"
                    placeholder="e.g., Toyota, Honda"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Model</FormLabel>
                <FormControl>
                  <Input
                    className="h-8 text-sm"
                    placeholder="e.g., Camry, Civic"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="variant"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Variant</FormLabel>
                <FormControl>
                  <Input
                    className="h-8 text-sm"
                    placeholder="e.g., SE, Limited"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2 lg:col-span-3">
                <FormLabel className="text-xs font-medium">
                  Description
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-8 text-sm"
                    placeholder="Full vehicle description"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Vehicle Specification Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          Vehicle Specification
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="colour"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Colour</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select colour" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COLOURS.map((colour) => (
                      <SelectItem key={colour} value={colour}>
                        {colour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trim"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Trim</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select trim" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TRIMS.map((trim) => (
                      <SelectItem key={trim} value={trim}>
                        {trim}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bodyStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Body Style
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select body style" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BODY_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Transmission
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TRANSMISSIONS.map((trans) => (
                      <SelectItem key={trans} value={trans}>
                        {trans}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Fuel Type
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FUEL_TYPES.map((fuel) => (
                      <SelectItem key={fuel} value={fuel}>
                        {fuel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="engineSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Engine Size
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-8 text-sm"
                    placeholder="e.g., 2.0L, 3.5L"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numberOfDoors"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Number of Doors
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select doors" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DOORS.map((door) => (
                      <SelectItem key={door} value={door}>
                        {door}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Registration & Mileage Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          Registration & Mileage
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="registrationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Registration Date
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="h-8 text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="odometerReading"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Odometer Reading (km)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    placeholder="Kilometers driven"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Valuation Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Valuation</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="customerExpectedPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Customer Expected Price (SAR)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marketValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Market Value (SAR)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appraisalOffer"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  Appraisal Offer (SAR)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    placeholder="0.00"
                    disabled
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Appraisal Status Section (if exists) */}
      {appraisal && (
        <>
          <Separator />
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">
                    Appraisal Status
                  </h4>
                  {appraisal.APPRAISAL_STATUS && (
                    <Badge
                      variant={
                        appraisal.APPRAISAL_STATUS === 'Pending' ||
                        appraisal.APPRAISAL_STATUS === 'InProgress'
                          ? 'secondary'
                          : appraisal.APPRAISAL_STATUS === 'Completed' ||
                            appraisal.APPRAISAL_STATUS === 'Approved'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {appraisal.APPRAISAL_STATUS}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {appraisal.REQUESTED_BY && (
                    <div>
                      <span className="text-muted-foreground">
                        Requested By:
                      </span>
                      <p className="font-medium">{appraisal.REQUESTED_BY}</p>
                    </div>
                  )}

                  {appraisal.REQUESTED_DATE && (
                    <div>
                      <span className="text-muted-foreground">
                        Requested Date:
                      </span>
                      <p className="font-medium">
                        {new Date(appraisal.REQUESTED_DATE).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {appraisal.ASSIGNED_TO && (
                    <div>
                      <span className="text-muted-foreground">
                        Assigned To:
                      </span>
                      <p className="font-medium">{appraisal.ASSIGNED_TO}</p>
                    </div>
                  )}

                  {appraisal.APPRAISED_BY && (
                    <div>
                      <span className="text-muted-foreground">
                        Appraised By:
                      </span>
                      <p className="font-medium">{appraisal.APPRAISED_BY}</p>
                    </div>
                  )}

                  {appraisal.APPRAISED_DATE && (
                    <div>
                      <span className="text-muted-foreground">
                        Appraised Date:
                      </span>
                      <p className="font-medium">
                        {new Date(
                          appraisal.APPRAISED_DATE
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {appraisal.REQUEST_NOTES && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Request Notes:
                    </span>
                    <p className="text-sm mt-1">{appraisal.REQUEST_NOTES}</p>
                  </div>
                )}

                {appraisal.APPRAISAL_NOTES && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Appraisal Notes:
                    </span>
                    <p className="text-sm mt-1">{appraisal.APPRAISAL_NOTES}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
