"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IconSearch, IconCheck, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { VehicleInventory } from "@/services/vehicles";
import { ButtonLoading } from "@/components/shared/button-loading";

interface VehicleSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVehicle?: (vehicle: VehicleInventory) => void;
  onSelectVehicles?: (vehicles: VehicleInventory[]) => void;
  vehicles: VehicleInventory[];
  isLoading?: boolean;
}

const ROW_BATCH_SIZE = 200;
const ALL_FILTER = "__ALL__";

interface IndexedVehicle {
  id: string;
  raw: VehicleInventory;
  vin: string;
  itemCode: string;
  brand: string;
  model: string;
  description: string;
  color: string;
  year: string;
  displayDateRaw: string;
  displayDate: string;
  price: string;
  discount: string;
  discPrice: string;
  warehouse: string;
  stockId: string;
  age: number;
  searchIndex: string;
}

export function VehicleSelectionModal({
  open,
  onOpenChange,
  onSelectVehicle,
  onSelectVehicles,
  vehicles,
  isLoading,
}: VehicleSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedVehicle, setSelectedVehicle] = useState<IndexedVehicle | null>(null);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [brandFilter, setBrandFilter] = useState(ALL_FILTER);
  const [modelFilter, setModelFilter] = useState(ALL_FILTER);
  const [colorFilter, setColorFilter] = useState(ALL_FILTER);
  const [yearFilter, setYearFilter] = useState(ALL_FILTER);
  const [warehouseFilter, setWarehouseFilter] = useState(ALL_FILTER);
  const [visibleRows, setVisibleRows] = useState(ROW_BATCH_SIZE);
  const [horizontalTrackWidth, setHorizontalTrackWidth] = useState(1700);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const horizontalScrollRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const scrollSyncSourceRef = useRef<"table" | "bar" | null>(null);

  const getValueFromKeys = (vehicle: VehicleInventory, keys: string[]): string => {
    const row = vehicle as unknown as Record<string, unknown>;
    const normalizedKeys = new Set(
      keys.map((key) => key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
    );

    for (const [rawKey, rawValue] of Object.entries(row)) {
      if (rawValue === null || rawValue === undefined) continue;
      const value = String(rawValue).trim();
      if (!value) continue;

      const normalizedRawKey = rawKey
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
      if (normalizedKeys.has(normalizedRawKey)) {
        return value;
      }
    }

    return "";
  };

  const getValueFromContains = (vehicle: VehicleInventory, terms: string[]): string => {
    const row = vehicle as unknown as Record<string, unknown>;
    const normalizedTerms = terms.map((term) =>
      term.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    );

    for (const [rawKey, rawValue] of Object.entries(row)) {
      if (rawValue === null || rawValue === undefined) continue;
      const value = String(rawValue).trim();
      if (!value) continue;

      const normalizedRawKey = rawKey
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      if (normalizedTerms.some((term) => normalizedRawKey.includes(term))) {
        return value;
      }
    }

    return "";
  };

  const getVehicleVin = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, [
      "VIN",
      "VINNUMBER",
      "vin",
      "vinNumber",
      "U_Veh_StockID",
      "u_veh_stockid",
    ]);

  const getVehicleItemCode = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, ["ItemCode", "ITEMCODE", "ProductCode", "PRODUCTCODE"]) || "N/A";

  const getModelFromItemCode = (itemCode: string): string => {
    if (!itemCode || itemCode === "N/A") return "";
    const token = itemCode.split("-")[0];
    return token?.trim() || "";
  };

  const getVehicleBrand = (vehicle: VehicleInventory) => {
    return (
      getValueFromKeys(vehicle, [
        "U_Veh_Brand",
        "U_VEH_BRAND",
        "BRAND",
        "Brand",
        "MAKE",
        "Make",
      ]) ||
      getValueFromContains(vehicle, ["brand", "make"]) ||
      "ISUZU"
    );
  };

  const getVehicleModel = (vehicle: VehicleInventory) => {
    const itemCode = getVehicleItemCode(vehicle);
    return (
      getValueFromKeys(vehicle, [
        "U_Veh_Model",
        "U_VEH_MODEL",
        "MODEL",
        "Model",
        "U_Veh_ModelFull",
        "U_Veh_ModelDescr",
      ]) ||
      getValueFromContains(vehicle, ["model"]) ||
      getModelFromItemCode(itemCode) ||
      "N/A"
    );
  };

  const getVehicleDescription = (vehicle: VehicleInventory) => {
    return (
      getValueFromKeys(vehicle, [
        "U_Veh_ModelDescr",
        "U_Veh_ModelFull",
        "Model Description",
        "DESCRIPTION",
        "Description",
        "ItemName",
        "FrgnName",
      ]) ||
      getValueFromContains(vehicle, ["description", "descr", "itemname"]) ||
      getModelFromItemCode(getVehicleItemCode(vehicle)) ||
      "N/A"
    );
  };

  const getVehicleColor = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, ["U_Veh_Color", "U_VEH_COLOR", "COLOR", "Color"]) || "N/A";

  const getVehicleYear = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, ["U_Veh_MY", "MODELYEAR", "YEAR", "Year"]) || "N/A";

  const getVehicleDisplayDate = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, ["U_Veh_DispDate", "U_VEH_DISPDATE", "DispDate", "DisplayDate", "DISPLAYDATE"]) || "N/A";

  const formatDisplayDate = (value: string) => {
    if (!value || value === "N/A") return "N/A";
    const trimmed = value.trim();

    // SAP HANA timestamps usually start with YYYY-MM-DD; keep only date part.
    const datePrefixMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (datePrefixMatch?.[1]) {
      return datePrefixMatch[1];
    }

    return trimmed;
  };

  const parseNumber = (value: string): number | null => {
    if (!value || value === "N/A") return null;
    const normalized = value
      .replace(/,/g, "")
      .replace(/[^0-9.-]/g, "")
      .trim();
    if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatAmount = (value: string, currency = "SAR") => {
    const parsed = parseNumber(value);
    if (parsed === null) return "N/A";
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parsed)}`;
  };

  const getVehicleCurrency = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, ["Currency", "CURRENCY", "Curr", "CURR"]) || "SAR";

  const getVehiclePrice = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, [
      "Price",
      "PRICE",
      "UnitPrice",
      "UNITPRICE",
      "ListPrice",
      "LISTPRICE",
      "Amount",
      "AMOUNT",
      "AmountWithoutTax",
      "AMOUNTWITHOUTTAX",
    ]) || "N/A";

  const getVehicleDiscountedPrice = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, [
      "Discprice",
      "DISCPRICE",
      "DiscPrice",
      "DISCPRICE",
      "DiscountPrice",
      "DISCOUNTPRICE",
      "NetPrice",
      "NETPRICE",
      "AmountAfterDiscount",
      "AMOUNTAFTERDISCOUNT",
      "PRICEAFTERDISCOUNT",
    ]) || "";

  const getVehicleDiscountValue = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, [
      "Discount",
      "DISCOUNT",
      "DiscPrcnt",
      "DISCPRCNT",
      "DiscPercent",
      "DISCPERCENT",
      "DiscountPercent",
      "DISCOUNTPERCENT",
      "DiscAmt",
      "DISCAMT",
      "DiscountAmount",
      "DISCOUNTAMOUNT",
    ]) || "";

  const getVehicleWarehouse = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, ["WhsName", "WHSNAME", "WhsCode", "WHSCODE"]) || "N/A";

  const getVehicleStockId = (vehicle: VehicleInventory) =>
    getValueFromKeys(vehicle, ["U_Veh_StockID", "U_VEH_STOCKID", "StockID", "STOCKID"]) || "N/A";

  const getVehicleStatus = (ageValue: number) => {
    const age = Number(ageValue ?? 0);
    if (Number.isFinite(age) && age > 100) {
      return { text: "Aging", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    }
    return { text: "Available", className: "bg-green-500/10 text-green-600 border-green-500/20" };
  };

  const indexedVehicles = useMemo<IndexedVehicle[]>(() => {
    return vehicles.map((vehicle, index) => {
      const vin = getVehicleVin(vehicle) || "N/A";
      const itemCode = getVehicleItemCode(vehicle);
      const brand = getVehicleBrand(vehicle) || "N/A";
      const model = getVehicleModel(vehicle) || "N/A";
      const description = getVehicleDescription(vehicle) || "N/A";
      const color = getVehicleColor(vehicle) || "N/A";
      const year = getVehicleYear(vehicle) || "N/A";
      const displayDateRaw = getVehicleDisplayDate(vehicle) || "N/A";
      const displayDate = formatDisplayDate(displayDateRaw);
      const currency = getVehicleCurrency(vehicle);
      const priceRaw = getVehiclePrice(vehicle);
      const discountedRaw = getVehicleDiscountedPrice(vehicle);
      const discountRaw = getVehicleDiscountValue(vehicle);
      const price = formatAmount(priceRaw, currency);
      const discPrice = discountedRaw ? formatAmount(discountedRaw, currency) : "N/A";
      const discount = (() => {
        if (discountRaw) {
          if (discountRaw.includes("%")) {
            return discountRaw;
          }
          const parsedDiscount = parseNumber(discountRaw);
          return parsedDiscount !== null ? formatAmount(discountRaw, currency) : "N/A";
        }

        const basePrice = parseNumber(priceRaw);
        const discountedPrice = parseNumber(discountedRaw);
        if (
          basePrice !== null &&
          discountedPrice !== null &&
          basePrice > 0 &&
          discountedPrice <= basePrice
        ) {
          const discountAmount = basePrice - discountedPrice;
          const discountPercent = (discountAmount / basePrice) * 100;
          return `${discountPercent.toFixed(2)}%`;
        }

        return discountedRaw ? formatAmount(discountedRaw, currency) : "N/A";
      })();
      const warehouse = getVehicleWarehouse(vehicle) || "N/A";
      const stockId = getVehicleStockId(vehicle) || "N/A";
      const age = Number(vehicle.AgeinDays ?? 0);
      const id = [
        vin,
        itemCode,
        vehicle.InDate || "no-date",
        stockId,
        String(vehicle.WhsCode || warehouse || "no-whs"),
        index,
      ].join("-");

      return {
        id,
        raw: vehicle,
        vin,
        itemCode,
        brand,
        model,
        description,
        color,
        year,
        displayDateRaw,
        displayDate,
        price,
        discount,
        discPrice,
        warehouse,
        stockId,
        age,
        searchIndex: [
          vin,
          itemCode,
          brand,
          model,
          description,
          color,
          year,
          displayDateRaw,
          displayDate,
          priceRaw,
          discountedRaw,
          discountRaw,
          warehouse,
          stockId,
        ]
          .join(" ")
          .toLowerCase(),
      };
    });
  }, [vehicles]);

  const filterOptions = useMemo(() => {
    const brands = new Set<string>();
    const models = new Set<string>();
    const colors = new Set<string>();
    const years = new Set<string>();
    const warehouses = new Set<string>();

    for (const vehicle of indexedVehicles) {
      brands.add(vehicle.brand);
      models.add(vehicle.model);
      colors.add(vehicle.color);
      years.add(vehicle.year);
      warehouses.add(vehicle.warehouse);
    }

    const sortedYears = Array.from(years).sort((a, b) => {
      const yearA = Number(a);
      const yearB = Number(b);
      const bothNumeric = Number.isFinite(yearA) && Number.isFinite(yearB);
      if (bothNumeric) return yearB - yearA;
      return a.localeCompare(b);
    });

    return {
      brands: Array.from(brands).sort((a, b) => a.localeCompare(b)),
      models: Array.from(models).sort((a, b) => a.localeCompare(b)),
      colors: Array.from(colors).sort((a, b) => a.localeCompare(b)),
      years: sortedYears,
      warehouses: Array.from(warehouses).sort((a, b) => a.localeCompare(b)),
    };
  }, [indexedVehicles]);

  const filteredVehicles = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return indexedVehicles.filter((vehicle) => {
      if (brandFilter !== ALL_FILTER && vehicle.brand !== brandFilter) return false;
      if (modelFilter !== ALL_FILTER && vehicle.model !== modelFilter) return false;
      if (colorFilter !== ALL_FILTER && vehicle.color !== colorFilter) return false;
      if (yearFilter !== ALL_FILTER && vehicle.year !== yearFilter) return false;
      if (warehouseFilter !== ALL_FILTER && vehicle.warehouse !== warehouseFilter) return false;

      if (!query) return true;
      return vehicle.searchIndex.includes(query);
    });
  }, [
    indexedVehicles,
    deferredSearchQuery,
    brandFilter,
    modelFilter,
    colorFilter,
    yearFilter,
    warehouseFilter,
  ]);

  const displayedVehicles = useMemo(
    () => filteredVehicles.slice(0, visibleRows),
    [filteredVehicles, visibleRows]
  );
  const selectedVehicles = useMemo(
    () => indexedVehicles.filter((vehicle) => selectedVehicleIds.has(vehicle.id)),
    [indexedVehicles, selectedVehicleIds]
  );

  useEffect(() => {
    setVisibleRows(Math.min(ROW_BATCH_SIZE, filteredVehicles.length));
  }, [filteredVehicles.length, open, ROW_BATCH_SIZE]);

  useEffect(() => {
    const updateWidth = () => {
      const width = tableRef.current?.scrollWidth || 1700;
      setHorizontalTrackWidth(Math.max(width, 1700));
    };

    const frame = requestAnimationFrame(updateWidth);
    return () => cancelAnimationFrame(frame);
  }, [displayedVehicles.length, open, searchQuery]);

  const syncHorizontalScroll = useCallback((source: "table" | "bar", scrollLeft: number) => {
    const table = tableScrollRef.current;
    const bar = horizontalScrollRef.current;
    if (!table || !bar) return;

    if (source !== "table" && Math.abs(table.scrollLeft - scrollLeft) > 1) {
      table.scrollLeft = scrollLeft;
    }

    if (source !== "bar" && Math.abs(bar.scrollLeft - scrollLeft) > 1) {
      bar.scrollLeft = scrollLeft;
    }
  }, []);

  useEffect(() => {
    const table = tableScrollRef.current;
    const bar = horizontalScrollRef.current;
    if (!table || !bar) return;

    bar.scrollLeft = table.scrollLeft;

    const onTableScrollSync = () => {
      if (scrollSyncSourceRef.current === "bar") return;
      scrollSyncSourceRef.current = "table";
      syncHorizontalScroll("table", table.scrollLeft);
      requestAnimationFrame(() => {
        if (scrollSyncSourceRef.current === "table") {
          scrollSyncSourceRef.current = null;
        }
      });
    };

    const onBarScrollSync = () => {
      if (scrollSyncSourceRef.current === "table") return;
      scrollSyncSourceRef.current = "bar";
      syncHorizontalScroll("bar", bar.scrollLeft);
      requestAnimationFrame(() => {
        if (scrollSyncSourceRef.current === "bar") {
          scrollSyncSourceRef.current = null;
        }
      });
    };

    table.addEventListener("scroll", onTableScrollSync, { passive: true });
    bar.addEventListener("scroll", onBarScrollSync, { passive: true });

    return () => {
      table.removeEventListener("scroll", onTableScrollSync);
      bar.removeEventListener("scroll", onBarScrollSync);
    };
  }, [open, filteredVehicles.length, syncHorizontalScroll]);

  const handleMainScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const main = event.currentTarget;

      const nearBottom = main.scrollTop + main.clientHeight >= main.scrollHeight - 120;
      if (nearBottom) {
        setVisibleRows((current) => {
          if (current >= filteredVehicles.length) return current;
          return Math.min(current + ROW_BATCH_SIZE, filteredVehicles.length);
        });
      }
    },
    [filteredVehicles.length, ROW_BATCH_SIZE]
  );

  const handleTableWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const main = tableScrollRef.current;
    if (!main) return;

    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    const shouldScrollHorizontally = event.shiftKey || absX > absY;

    if (!shouldScrollHorizontally) return;

    event.preventDefault();
    const delta = absX > 0 ? event.deltaX : event.deltaY;
    const nextLeft = Math.max(0, Math.min(main.scrollLeft + delta, main.scrollWidth - main.clientWidth));
    main.scrollLeft = nextLeft;
    syncHorizontalScroll("table", nextLeft);
  }, [syncHorizontalScroll]);

  const scrollHorizontalBy = useCallback((offset: number) => {
    const main = tableScrollRef.current;
    if (!main) return;
    const nextLeft = Math.max(
      0,
      Math.min(main.scrollLeft + offset, main.scrollWidth - main.clientWidth)
    );
    main.scrollLeft = nextLeft;
    syncHorizontalScroll("table", nextLeft);
  }, [syncHorizontalScroll]);

  const resetFilters = useCallback(() => {
    setBrandFilter(ALL_FILTER);
    setModelFilter(ALL_FILTER);
    setColorFilter(ALL_FILTER);
    setYearFilter(ALL_FILTER);
    setWarehouseFilter(ALL_FILTER);
  }, []);

  useEffect(() => {
    if (!open) {
      setSelectedVehicle(null);
      setSelectedVehicleIds(new Set());
      setSearchQuery("");
      resetFilters();
    }
  }, [open, resetFilters]);

  const handleSelect = () => {
    if (selectedVehicles.length > 0) {
      const selectedRawVehicles = selectedVehicles.map((vehicle) => vehicle.raw);

      // Single selection should use single-select handler to avoid duplicate handling paths.
      if (selectedRawVehicles.length === 1 && onSelectVehicle) {
        onSelectVehicle(selectedRawVehicles[0]);
      } else if (onSelectVehicles) {
        onSelectVehicles(selectedRawVehicles);
      } else if (onSelectVehicle) {
        onSelectVehicle(selectedRawVehicles[0]);
      }
      onOpenChange(false);
      setSelectedVehicle(null);
      setSelectedVehicleIds(new Set());
      setSearchQuery("");
      resetFilters();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedVehicle(null);
    setSelectedVehicleIds(new Set());
    setSearchQuery("");
    resetFilters();
  };

  const toggleVehicleSelection = useCallback((vehicleData: IndexedVehicle) => {
    setSelectedVehicle(vehicleData);
    setSelectedVehicleIds((current) => {
      const next = new Set(current);
      if (next.has(vehicleData.id)) {
        next.delete(vehicleData.id);
      } else {
        next.add(vehicleData.id);
      }
      return next;
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[96vh] w-[99vw] max-w-[99vw] overflow-hidden p-0 sm:max-w-[99vw]">
        <DialogHeader className="border-b px-4 py-2.5">
          <DialogTitle>Select Vehicle</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col p-2.5">
          {/* Search */}
          <div className="mb-2 flex flex-col gap-1.5 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by VIN, item code, brand, model, warehouse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-10 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] text-muted-foreground">
              <Badge variant="outline" className="whitespace-nowrap px-2 py-0 text-[10px]">
                Total: {vehicles.length}
              </Badge>
              <Badge variant="outline" className="whitespace-nowrap px-2 py-0 text-[10px]">
                Showing: {displayedVehicles.length} / {filteredVehicles.length}
              </Badge>
              {selectedVehicleIds.size > 0 ? (
                <Badge variant="outline" className="whitespace-nowrap px-2 py-0 text-[10px]">
                  Selected: {selectedVehicleIds.size}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="mb-2 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
              <select
                value={brandFilter}
                onChange={(event) => setBrandFilter(event.target.value)}
                className="h-8 min-w-[170px] rounded-md border bg-background px-2 text-xs"
              >
                <option value={ALL_FILTER}>All Brands</option>
                {filterOptions.brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>

              <select
                value={modelFilter}
                onChange={(event) => setModelFilter(event.target.value)}
                className="h-8 min-w-[170px] rounded-md border bg-background px-2 text-xs"
              >
                <option value={ALL_FILTER}>All Models</option>
                {filterOptions.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>

              <select
                value={colorFilter}
                onChange={(event) => setColorFilter(event.target.value)}
                className="h-8 min-w-[170px] rounded-md border bg-background px-2 text-xs"
              >
                <option value={ALL_FILTER}>All Colors</option>
                {filterOptions.colors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>

              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="h-8 min-w-[150px] rounded-md border bg-background px-2 text-xs"
              >
                <option value={ALL_FILTER}>All Years</option>
                {filterOptions.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={warehouseFilter}
                onChange={(event) => setWarehouseFilter(event.target.value)}
                className="h-8 min-w-[190px] rounded-md border bg-background px-2 text-xs"
              >
                <option value={ALL_FILTER}>All Warehouses</option>
                {filterOptions.warehouses.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>

              <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-5 w-5"
                onClick={() => scrollHorizontalBy(-260)}
              >
                <IconChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-5 w-5"
                onClick={() => scrollHorizontalBy(260)}
              >
                <IconChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {filteredVehicles.length > 0 && (
            <div
              ref={horizontalScrollRef}
              className="mb-2 mt-1 h-4 overflow-x-scroll overflow-y-hidden rounded border bg-muted/20"
            >
              <div
                style={{ width: horizontalTrackWidth, height: 14 }}
              />
            </div>
          )}

          {/* Vehicle List */}
          <div className="min-h-0 flex-1 rounded-lg border">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <ButtonLoading text="Loading vehicles..." size="sm" />
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <div className="text-sm text-muted-foreground">
                  {searchQuery || brandFilter !== ALL_FILTER || modelFilter !== ALL_FILTER || colorFilter !== ALL_FILTER || yearFilter !== ALL_FILTER || warehouseFilter !== ALL_FILTER
                    ? "No vehicles found for the selected search/filters"
                    : "No vehicles available"}
                </div>
              </div>
            ) : (
              <div
                ref={tableScrollRef}
                className="h-full overflow-x-scroll overflow-y-auto pb-2"
                style={{ scrollbarGutter: "stable both-edges" }}
                onScroll={handleMainScroll}
                onWheel={handleTableWheel}
              >
                <table ref={tableRef} className="min-w-[1780px] text-[11px]">
                  <thead className="sticky top-0 z-10 bg-muted/30 backdrop-blur">
                    <tr className="border-b">
                      <th className="h-9 w-10 px-2 text-left font-medium"></th>
                      <th className="h-9 min-w-[180px] px-2 text-left font-medium">VIN</th>
                      <th className="h-9 min-w-[105px] px-2 text-left font-medium">Item Code</th>
                      <th className="h-9 min-w-[100px] px-2 text-left font-medium">Brand</th>
                      <th className="h-9 min-w-[120px] px-2 text-left font-medium">Model</th>
                      <th className="h-9 min-w-[180px] px-2 text-left font-medium">Description</th>
                      <th className="h-9 min-w-[85px] px-2 text-left font-medium">Color</th>
                      <th className="h-9 min-w-[70px] px-2 text-left font-medium">Year</th>
                      <th className="h-9 min-w-[120px] px-2 text-left font-medium">Display Date</th>
                      <th className="h-9 min-w-[120px] px-2 text-left font-medium">Price</th>
                      <th className="h-9 min-w-[100px] px-2 text-left font-medium">Discount</th>
                      <th className="h-9 min-w-[120px] px-2 text-left font-medium">Discprice</th>
                      <th className="h-9 min-w-[110px] px-2 text-left font-medium">Warehouse</th>
                      <th className="h-9 min-w-[80px] px-2 text-left font-medium">Age</th>
                      <th className="h-9 min-w-[95px] px-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                  {displayedVehicles.map((vehicleData) => {
                    const isSelected = selectedVehicleIds.has(vehicleData.id);
                    const status = getVehicleStatus(vehicleData.age);
                    return (
                      <tr
                        key={vehicleData.id}
                        className={`cursor-pointer border-b text-xs ${
                          isSelected ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleVehicleSelection(vehicleData)}
                      >
                        <td className="px-2 py-1.5 align-middle">
                          {isSelected && (
                            <IconCheck className="h-4 w-4 text-primary" />
                          )}
                        </td>
                        <td className="px-2 py-1.5 align-middle font-medium">{vehicleData.vin}</td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.itemCode}</td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.brand}</td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.model}</td>
                        <td className="max-w-[180px] truncate px-2 py-1.5 align-middle">
                          {vehicleData.description}
                        </td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.color}</td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.year}</td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.displayDate}</td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.price}</td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.discount}</td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.discPrice}</td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.warehouse}</td>
                        <td className="px-2 py-1.5 align-middle">{vehicleData.raw.AgeinDays ?? "N/A"}</td>
                        <td className="px-2 py-1.5 align-middle">
                          <Badge
                            variant="outline"
                            className={`${status.className} text-[10px]`}
                          >
                            {status.text}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {displayedVehicles.length < filteredVehicles.length ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Scroll down to load more vehicles ({displayedVehicles.length} of {filteredVehicles.length} loaded).
            </p>
          ) : null}

          {/* Selection Info */}
          {selectedVehicles.length > 0 && (
            <div className="mt-1.5 rounded-lg bg-muted p-2">
              <div className="mb-1 text-xs font-medium">
                Selected Vehicle{selectedVehicles.length > 1 ? "s" : ""} ({selectedVehicles.length})
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedVehicles
                  .slice(0, 3)
                  .map((vehicle) => `${vehicle.brand} ${vehicle.model} (VIN: ${vehicle.vin || "N/A"})`)
                  .join(", ")}
                {selectedVehicles.length > 3 ? ` +${selectedVehicles.length - 3} more` : ""}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t bg-background px-4 py-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={selectedVehicleIds.size === 0}>
            Select {selectedVehicleIds.size > 0 ? `${selectedVehicleIds.size} ` : ""}Vehicle
            {selectedVehicleIds.size === 1 ? "" : "s"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
