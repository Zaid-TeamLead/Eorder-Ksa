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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Search, Mail, MessageSquare, FileText, UserPlus } from "lucide-react";

const TABS = [
  { id: "customer-information", label: "Customer Information" },
  { id: "vehicle-details", label: "Vehicle Details" },
  { id: "enquiry-details", label: "Enquiry Details" },
  { id: "trade-in", label: "Trade-in Vehicle" },
  { id: "additional", label: "Additional Info" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SalesEnquiry({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const params = use(searchParams);
  const action = params.action;
  const [isCreate, setIsCreate] = useState(action === "create");
  const [currentTab, setCurrentTab] = useState<TabId>("customer-information");
  const [customerSearch, setCustomerSearch] = useState("");

  useEffect(() => {
    setIsCreate(action === "create");
    if (!isCreate) {
      setCurrentTab("customer-information");
    }
  }, [action, isCreate]);

  const handleNext = () => {
    const currentIndex = TABS.findIndex((tab) => tab.id === currentTab);
    if (currentIndex < TABS.length - 1) {
      setCurrentTab(TABS[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = TABS.findIndex((tab) => tab.id === currentTab);
    if (currentIndex > 0) {
      setCurrentTab(TABS[currentIndex - 1].id);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Form data:", data);
    // Handle form submission here
    setIsCreate(false);
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <DataTable data={data} />
      <Dialog
        open={isCreate}
        onOpenChange={(open) => {
          setIsCreate(open);
          if (!open) {
            setCurrentTab("customer-information");
            setCustomerSearch("");
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogContent className="max-h-[calc(100vh-7rem)] w-full h-full flex flex-col sm:max-w-7xl">
            <DialogHeader>
              <DialogTitle>Create Sales Enquiry</DialogTitle>
              <DialogDescription>
                Create a new sales enquiry here. Fill in all the tabs and click
                save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <Tabs
              value={currentTab}
              onValueChange={(value) => setCurrentTab(value as TabId)}
              className="w-full flex-1 flex flex-col gap-4"
            >
              <TabsList className="w-full justify-start">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 overflow-y-auto pr-2">
                {/* Customer Information Tab */}
                <TabsContent
                  value="customer-information"
                  className="flex flex-col gap-4 mt-0"
                >
                  <div className="grid gap-6">
                    {/* Customer Search Row */}
                    <div className="flex items-center gap-3">
                      <Label htmlFor="customer-search" className="text-sm font-medium whitespace-nowrap">
                        Customer
                      </Label>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="customer-search"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            placeholder="Search customer by name, phone, or email"
                            className={cn(
                              "pr-10",
                              customerSearch && "border-destructive ring-destructive/20 ring-2"
                            )}
                          />
                          {customerSearch && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                              2
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            // Handle customer search
                            console.log("Searching for:", customerSearch);
                          }}
                          className="shrink-0"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Previous customer details
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Customer notes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          onClick={() => {
                            // Clear form for new customer
                            setCustomerSearch("");
                          }}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          New customer
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Customer Details - Three Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column */}
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="customer-name">Name</Label>
                          <Input id="customer-name" name="customerName" />
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
                        <div className="grid gap-2">
                          <Label htmlFor="postcode">Postcode</Label>
                          <Input id="postcode" name="postcode" />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Send Email
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Send SMS
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Send Letter
                          </Button>
                        </div>
                      </div>

                      {/* Middle Column - Contact Information */}
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="home-phone">Home</Label>
                          <Input id="home-phone" name="homePhone" type="tel" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="work-phone">Work</Label>
                          <Input id="work-phone" name="workPhone" type="tel" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="mobile">Mobile *</Label>
                          <Input id="mobile" name="mobile" type="tel" required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="home-email">Home Email</Label>
                          <Input id="home-email" name="homeEmail" type="email" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="work-email">Work Email</Label>
                          <Input id="work-email" name="workEmail" type="email" />
                        </div>
                      </div>

                      {/* Right Column - Additional Details */}
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="previous-name">Previous name</Label>
                          <Input id="previous-name" name="previousName" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="job-title">Job title</Label>
                          <Input id="job-title" name="jobTitle" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="company-position">Company position</Label>
                          <Input id="company-position" name="companyPosition" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="business-type">Business type</Label>
                          <Input id="business-type" name="businessType" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="source-of-info">Source of info</Label>
                          <Select name="sourceOfInfo">
                            <SelectTrigger id="source-of-info">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
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
                          <Label htmlFor="date-of-birth">Date of birth</Label>
                          <Input id="date-of-birth" name="dateOfBirth" type="date" />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Vehicle Details Tab */}
                <TabsContent
                  value="vehicle-details"
                  className="flex flex-col gap-4 mt-0"
                >
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
                </TabsContent>

                {/* Enquiry Details Tab */}
                <TabsContent
                  value="enquiry-details"
                  className="flex flex-col gap-4 mt-0"
                >
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
                </TabsContent>

                {/* Trade-in Vehicle Tab */}
                <TabsContent
                  value="trade-in"
                  className="flex flex-col gap-4 mt-0"
                >
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
                </TabsContent>

                {/* Additional Information Tab */}
                <TabsContent
                  value="additional"
                  className="flex flex-col gap-4 mt-0"
                >
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
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="mt-auto flex items-center justify-between">
              <div className="flex gap-2">
                {TABS.findIndex((tab) => tab.id === currentTab) > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                  >
                    Previous
                  </Button>
                )}
                {TABS.findIndex((tab) => tab.id === currentTab) <
                  TABS.length - 1 && (
                  <Button type="button" onClick={handleNext}>
                    Next
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                {currentTab === TABS[TABS.length - 1].id && (
                  <Button type="submit">Save changes</Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </div>
  );
}
