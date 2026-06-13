import { describe, it, expect } from "vitest";
import { canTransition, anyRoleCanTransition } from "@/lib/order-transitions";

describe("canTransition — مصفوفة دورة حياة الطلب", () => {
  it("kitchen: pending → preparing فقط", () => {
    expect(canTransition("pending", "preparing", "kitchen")).toBe(true);
    expect(canTransition("preparing", "ready", "kitchen")).toBe(false);
    expect(canTransition("pending", "ready", "kitchen")).toBe(false);
  });

  it("field: preparing→ready و ready→assigned و إعادة التعيين assigned→assigned", () => {
    expect(canTransition("preparing", "ready", "field")).toBe(true);
    expect(canTransition("ready", "assigned", "field")).toBe(true);
    expect(canTransition("assigned", "assigned", "field")).toBe(true);
    expect(canTransition("pending", "preparing", "field")).toBe(false);
  });

  it("delivery: قبول assigned→delivering، رفض assigned→ready، تسليم delivering→delivered", () => {
    expect(canTransition("assigned", "delivering", "delivery")).toBe(true);
    expect(canTransition("assigned", "ready", "delivery")).toBe(true);
    expect(canTransition("delivering", "delivered", "delivery")).toBe(true);
    expect(canTransition("ready", "assigned", "delivery")).toBe(false);
  });

  it("takeaway: ready→delivered وإلغاء فقط؛ لا انتقالات المطبخ/الميدان/السائق", () => {
    expect(canTransition("ready", "delivered", "takeaway")).toBe(true);
    expect(canTransition("pending", "cancelled", "takeaway")).toBe(true);
    expect(canTransition("pending", "preparing", "takeaway")).toBe(false);
    expect(canTransition("preparing", "ready", "takeaway")).toBe(false);
    expect(canTransition("assigned", "delivering", "takeaway")).toBe(false);
    expect(canTransition("ready", "assigned", "takeaway")).toBe(false);
  });

  it("cashier: إلغاء قبل التسليم فقط", () => {
    expect(canTransition("pending", "cancelled", "cashier")).toBe(true);
    expect(canTransition("delivering", "cancelled", "cashier")).toBe(true);
    expect(canTransition("delivered", "cancelled", "cashier")).toBe(false);
    expect(canTransition("pending", "preparing", "cashier")).toBe(false);
  });

  it("admin: أي انتقال مسموح", () => {
    expect(canTransition("pending", "delivered", "admin")).toBe(true);
    expect(canTransition("delivered", "pending", "admin")).toBe(true);
  });

  it("anyRoleCanTransition: يكفي دور واحد يسمح", () => {
    expect(anyRoleCanTransition("pending", "preparing", ["cashier", "kitchen"])).toBe(true);
    expect(anyRoleCanTransition("pending", "preparing", ["cashier", "delivery"])).toBe(false);
  });
});
