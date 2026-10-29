import { describe, expect, it } from "vitest";
import { getRoleRedirect } from "./route-access";

describe("getRoleRedirect", () => {
  it("allows administrators on the home page and admin screens", () => {
    expect(getRoleRedirect("/", "admin")).toBeNull();
    expect(getRoleRedirect("/admin/products", "admin")).toBeNull();
    expect(getRoleRedirect("/cadastrar-produto", "admin")).toBeNull();
  });

  it("sends administrators away from customer screens", () => {
    expect(getRoleRedirect("/store", "admin")).toBe("/admin/dashboard");
    expect(getRoleRedirect("/store/cart", "admin")).toBe("/admin/dashboard");
  });

  it("allows customers on the home page and store screens", () => {
    expect(getRoleRedirect("/", "customer")).toBeNull();
    expect(getRoleRedirect("/store", "customer")).toBeNull();
    expect(getRoleRedirect("/store/cart", "customer")).toBeNull();
  });

  it("sends customers away from admin screens", () => {
    expect(getRoleRedirect("/admin/products", "customer")).toBe("/store");
    expect(getRoleRedirect("/admin/stock", "customer")).toBe("/store");
    expect(getRoleRedirect("/cadastrar-produto", "customer")).toBe("/store");
  });
});
