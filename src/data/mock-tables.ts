import type { Table } from "./mock-types";

export const MOCK_TABLES: Table[] = [
  { id: "t01", number: 1,  capacity: 2, status: "available",  floor: 1 },
  { id: "t02", number: 2,  capacity: 4, status: "occupied",   floor: 1, currentOrderId: "ORD-006" },
  { id: "t03", number: 3,  capacity: 4, status: "occupied",   floor: 1, currentOrderId: "ORD-006" },
  { id: "t04", number: 4,  capacity: 6, status: "reserved",   floor: 1 },
  { id: "t05", number: 5,  capacity: 4, status: "occupied",   floor: 1, currentOrderId: "ORD-001" },
  { id: "t06", number: 6,  capacity: 2, status: "available",  floor: 1 },
  { id: "t07", number: 7,  capacity: 4, status: "cleaning",   floor: 1 },
  { id: "t08", number: 8,  capacity: 6, status: "occupied",   floor: 1, currentOrderId: "ORD-004" },
  { id: "t09", number: 9,  capacity: 8, status: "available",  floor: 1 },
  { id: "t10", number: 10, capacity: 4, status: "available",  floor: 1 },
  { id: "t11", number: 11, capacity: 2, status: "reserved",   floor: 2 },
  { id: "t12", number: 12, capacity: 6, status: "occupied",   floor: 2, currentOrderId: "ORD-008" },
  { id: "t13", number: 13, capacity: 4, status: "available",  floor: 2 },
  { id: "t14", number: 14, capacity: 8, status: "available",  floor: 2 },
  { id: "t15", number: 15, capacity: 4, status: "cleaning",   floor: 2 },
  { id: "t16", number: 16, capacity: 2, status: "available",  floor: 2 },
];

export const TABLE_STATUS_CONFIG = {
  available: { label: "متاحة",   color: "text-status-success", bg: "bg-status-success/10", border: "border-status-success/30" },
  occupied:  { label: "مشغولة",  color: "text-status-error",   bg: "bg-status-error/10",   border: "border-status-error/30"   },
  reserved:  { label: "محجوزة",  color: "text-status-warning", bg: "bg-status-warning/10", border: "border-status-warning/30" },
  cleaning:  { label: "تنظيف",   color: "text-status-info",    bg: "bg-status-info/10",    border: "border-status-info/30"    },
} as const;
