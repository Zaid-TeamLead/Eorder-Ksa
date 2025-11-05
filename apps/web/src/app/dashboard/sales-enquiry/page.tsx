"use client";
import { use, useState, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import data from "../data.json";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function SalesEnquiry({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const params = use(searchParams);
  const action = params.action;
  const [isCreate, setIsCreate] = useState(action === "create");

  useEffect(() => {
    setIsCreate(action === "create");
  }, [action]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <DataTable data={data} />
      <Dialog open={isCreate} onOpenChange={(open) => setIsCreate(open)}>
        <form>
          <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] w-full h-full flex flex-col">
            <DialogHeader>
              <DialogTitle>Create Sales Enquiry</DialogTitle>
              <DialogDescription>
                Create a new sales enquiry here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 flex-1 overflow-y-auto pr-2">
              {/* Customer Information Section */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customer-name">Customer Name *</Label>
                    <Input id="customer-name" name="customerName" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input id="mobile" name="mobile" type="tel" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="alternate-mobile">Alternate Mobile</Label>
                    <Input
                      id="alternate-mobile"
                      name="alternateMobile"
                      type="tel"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date-of-birth">Date of Birth</Label>
                    <Input id="date-of-birth" name="dateOfBirth" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender">
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input id="occupation" name="occupation" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" name="companyName" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    className={cn(
                      "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pincode">Pin Code</Label>
                    <Input id="pincode" name="pincode" type="number" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Vehicle Details Section */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="make">Make *</Label>
                    <Select name="make" required>
                      <SelectTrigger id="make">
                        <SelectValue placeholder="Select make" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maruti">Maruti Suzuki</SelectItem>
                        <SelectItem value="hyundai">Hyundai</SelectItem>
                        <SelectItem value="tata">Tata</SelectItem>
                        <SelectItem value="mahindra">Mahindra</SelectItem>
                        <SelectItem value="honda">Honda</SelectItem>
                        <SelectItem value="toyota">Toyota</SelectItem>
                        <SelectItem value="ford">Ford</SelectItem>
                        <SelectItem value="volkswagen">Volkswagen</SelectItem>
                        <SelectItem value="skoda">Skoda</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model">Model *</Label>
                    <Select name="model" required>
                      <SelectTrigger id="model">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="swift">Swift</SelectItem>
                        <SelectItem value="baleno">Baleno</SelectItem>
                        <SelectItem value="dzire">Dzire</SelectItem>
                        <SelectItem value="ertiga">Ertiga</SelectItem>
                        <SelectItem value="i20">i20</SelectItem>
                        <SelectItem value="verna">Verna</SelectItem>
                        <SelectItem value="creta">Creta</SelectItem>
                        <SelectItem value="nexon">Nexon</SelectItem>
                        <SelectItem value="altroz">Altroz</SelectItem>
                        <SelectItem value="scorpio">Scorpio</SelectItem>
                        <SelectItem value="xuv700">XUV700</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="variant">Variant</Label>
                    <Input
                      id="variant"
                      name="variant"
                      placeholder="e.g., VDI, ZDI, ZXI"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="year">Year</Label>
                    <Select name="year">
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + 1 - i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      name="color"
                      placeholder="Preferred color"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fuel-type">Fuel Type</Label>
                    <Select name="fuelType">
                      <SelectTrigger id="fuel-type">
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select name="transmission">
                      <SelectTrigger id="transmission">
                        <SelectValue placeholder="Select transmission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="amt">AMT</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Enquiry Details Section */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Enquiry Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="budget">Budget Range (₹)</Label>
                    <Select name="budget">
                      <SelectTrigger id="budget">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-5">₹0 - ₹5 Lakh</SelectItem>
                        <SelectItem value="5-10">₹5 - ₹10 Lakh</SelectItem>
                        <SelectItem value="10-15">₹10 - ₹15 Lakh</SelectItem>
                        <SelectItem value="15-20">₹15 - ₹20 Lakh</SelectItem>
                        <SelectItem value="20-25">₹20 - ₹25 Lakh</SelectItem>
                        <SelectItem value="25-30">₹25 - ₹30 Lakh</SelectItem>
                        <SelectItem value="30-40">₹30 - ₹40 Lakh</SelectItem>
                        <SelectItem value="40-50">₹40 - ₹50 Lakh</SelectItem>
                        <SelectItem value="50+">₹50 Lakh+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="financing">Financing Required</Label>
                    <Select name="financing">
                      <SelectTrigger id="financing">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="maybe">Maybe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="preferred-contact">
                      Preferred Contact Method
                    </Label>
                    <Select name="preferredContact">
                      <SelectTrigger id="preferred-contact">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="preferred-time">
                      Preferred Contact Time
                    </Label>
                    <Select name="preferredTime">
                      <SelectTrigger id="preferred-time">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">
                          Morning (9 AM - 12 PM)
                        </SelectItem>
                        <SelectItem value="afternoon">
                          Afternoon (12 PM - 5 PM)
                        </SelectItem>
                        <SelectItem value="evening">
                          Evening (5 PM - 8 PM)
                        </SelectItem>
                        <SelectItem value="anytime">Anytime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="preferred-delivery">
                      Preferred Delivery Date
                    </Label>
                    <Input
                      id="preferred-delivery"
                      name="preferredDelivery"
                      type="date"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="source">Source of Enquiry</Label>
                    <Select name="source">
                      <SelectTrigger id="source">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="social-media">
                          Social Media
                        </SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="advertisement">
                          Advertisement
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Trade-in Vehicle Section */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">
                  Trade-in Vehicle (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="trade-in-make">Make</Label>
                    <Input id="trade-in-make" name="tradeInMake" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="trade-in-model">Model</Label>
                    <Input id="trade-in-model" name="tradeInModel" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="trade-in-year">Year</Label>
                    <Input
                      id="trade-in-year"
                      name="tradeInYear"
                      type="number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="trade-in-kms">Kilometers</Label>
                    <Input
                      id="trade-in-kms"
                      name="tradeInKms"
                      type="number"
                      placeholder="KMs driven"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="trade-in-expected-price">
                      Expected Price (₹)
                    </Label>
                    <Input
                      id="trade-in-expected-price"
                      name="tradeInExpectedPrice"
                      type="number"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Additional Information */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">
                  Additional Information
                </h3>
                <div className="grid gap-2">
                  <Label htmlFor="salesperson">Assigned Salesperson</Label>
                  <Input
                    id="salesperson"
                    name="salesperson"
                    placeholder="Salesperson name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes / Comments</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    placeholder="Any additional notes or comments..."
                    className={cn(
                      "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                    )}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-auto">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </div>
  );
}
