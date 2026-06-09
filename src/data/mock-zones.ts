export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  estimatedMinutes: number;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: "z1",  name: "العليا",       fee: 10, estimatedMinutes: 20 },
  { id: "z2",  name: "الملقا",       fee: 12, estimatedMinutes: 25 },
  { id: "z3",  name: "النزهة",       fee: 15, estimatedMinutes: 30 },
  { id: "z4",  name: "الروضة",       fee: 18, estimatedMinutes: 35 },
  { id: "z5",  name: "الصفا",        fee: 20, estimatedMinutes: 40 },
  { id: "z6",  name: "حي الربيع",   fee: 12, estimatedMinutes: 25 },
  { id: "z7",  name: "حي الورود",   fee: 14, estimatedMinutes: 28 },
  { id: "z8",  name: "حي الصحافة", fee: 16, estimatedMinutes: 32 },
  { id: "z9",  name: "حي الغدير",  fee: 18, estimatedMinutes: 35 },
  { id: "z10", name: "حي اليرموك", fee: 22, estimatedMinutes: 45 },
];

export const RECENT_ZONE_IDS = ["z1", "z3", "z2"];

export function getZoneById(id: string): DeliveryZone | undefined {
  return DELIVERY_ZONES.find((z) => z.id === id);
}
