export type DriverStatus = "available" | "busy" | "offline";

export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  currentOrders: number;
  lastActivity: Date;
  zone?: string;
}

const now = new Date();
const ago = (m: number) => new Date(now.getTime() - m * 60000);

export const MOCK_DRIVERS: DeliveryDriver[] = [
  { id: "drv-1", name: "أحمد العمري",    phone: "0501111111", status: "available", currentOrders: 0, lastActivity: ago(4),  zone: "حي النزهة" },
  { id: "drv-2", name: "خالد المطيري",   phone: "0502222222", status: "busy",      currentOrders: 2, lastActivity: ago(12), zone: "حي الروضة" },
  { id: "drv-3", name: "فهد الشمري",     phone: "0503333333", status: "available", currentOrders: 1, lastActivity: ago(3),  zone: "حي المرسلات" },
  { id: "drv-4", name: "سعد القحطاني",   phone: "0504444444", status: "offline",   currentOrders: 0, lastActivity: ago(75) },
  { id: "drv-5", name: "محمد الدوسري",   phone: "0505555555", status: "available", currentOrders: 0, lastActivity: ago(7),  zone: "حي العليا" },
  { id: "drv-6", name: "عبدالله الرشيد", phone: "0506666666", status: "busy",      currentOrders: 1, lastActivity: ago(20), zone: "حي النزهة" },
];

export const getAvailableDrivers = () => MOCK_DRIVERS.filter(d => d.status === "available");
export const getDriverById = (id: string) => MOCK_DRIVERS.find(d => d.id === id);
