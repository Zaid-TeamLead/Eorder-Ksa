import type { VehicleChargeItem } from "@/services/vehicles";
import { toSafeText } from "@/lib/value-normalizers";

export function getVehicleChargePrice(charge: VehicleChargeItem): string {
  const candidates = [
    charge.PRICE,
    charge.Price,
    charge.UNITPRICE,
    charge.UnitPrice,
    charge.DISCPRICE,
    charge.Discprice,
    charge.AMOUNT,
    charge.Amount,
  ];

  for (const candidate of candidates) {
    const value = toSafeText(candidate);
    if (value) return value;
  }

  return "";
}
