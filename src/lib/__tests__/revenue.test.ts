import { describe, it, expect } from "vitest";
import { netRevenue, deliveryFeesTotal, deliveredCount, driverEarnings } from "@/lib/revenue";
import type { LiveOrder } from "@/contexts/OrderContext";

function order(p: Partial<LiveOrder>): LiveOrder {
  return {
    id: p.id ?? "x",
    type: "delivery",
    status: p.status ?? "delivered",
    subtotal: p.subtotal ?? 0,
    deliveryFee: p.deliveryFee ?? 0,
    tax: 0,
    total: p.total ?? 0,
    driverId: p.driverId,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...p,
  } as LiveOrder;
}

describe("الإيرادات — القاعدة: total - delivery_fee للمسلّمة فقط", () => {
  const orders: LiveOrder[] = [
    order({ id: "1", status: "delivered", total: 100, deliveryFee: 20, driverId: "d1" }),
    order({ id: "2", status: "delivered", total: 50,  deliveryFee: 10, driverId: "d2" }),
    order({ id: "3", status: "delivering", total: 80, deliveryFee: 15, driverId: "d1" }), // غير مسلّم
    order({ id: "4", status: "cancelled", total: 40,  deliveryFee: 10 }),                 // ملغي
  ];

  it("إيراد المطعم الصافي = (100-20)+(50-10) = 120", () => {
    expect(netRevenue(orders)).toBe(120);
  });

  it("رسوم التوصيل (مستحقات السائقين) = 20+10 = 30 (المسلّمة فقط)", () => {
    expect(deliveryFeesTotal(orders)).toBe(30);
  });

  it("عدد المسلّمة = 2", () => {
    expect(deliveredCount(orders)).toBe(2);
  });

  it("مستحقات السائق d1 = 20 (لا يحتسب الطلب قيد التوصيل)", () => {
    expect(driverEarnings(orders, "d1")).toBe(20);
  });

  it("الطلبات غير المسلّمة لا تدخل الإيراد", () => {
    expect(netRevenue([order({ status: "pending", total: 999, deliveryFee: 0 })])).toBe(0);
  });
});
