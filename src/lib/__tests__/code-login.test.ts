import { describe, it, expect } from "vitest";
import { resolveDemoCode } from "@/lib/dev-mock";

describe("الدخول بالكود الرقمي التجريبي", () => {
  it("يربط الأكواد الصحيحة بالمستخدمين", () => {
    expect(resolveDemoCode("1000000001")).toBe("admin");
    expect(resolveDemoCode("1000000002")).toBe("cashier1");
    expect(resolveDemoCode("1000000003")).toBe("kitchen1");
    expect(resolveDemoCode("1000000004")).toBe("field1");
    expect(resolveDemoCode("1000000005")).toBe("delivery1");
  });

  it("يتجاهل المسافات حول الكود", () => {
    expect(resolveDemoCode("  1000000001 ")).toBe("admin");
  });

  it("يرجع null للكود غير المسجّل", () => {
    expect(resolveDemoCode("9999999999")).toBeNull();
    expect(resolveDemoCode("")).toBeNull();
  });
});
