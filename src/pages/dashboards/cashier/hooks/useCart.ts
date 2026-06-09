import { useState, useCallback, useMemo } from "react";

export interface CartItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: { id: string; name: string; price: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        { menuItemId: item.id, name: item.name, unitPrice: item.price, quantity: 1, notes: "" },
      ];
    });
  }, []);

  const decrementItem = useCallback((menuItemId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.menuItemId === menuItemId);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter((i) => i.menuItemId !== menuItemId);
      return prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const updateNote = useCallback((menuItemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, notes } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  return {
    items,
    addItem,
    decrementItem,
    removeItem,
    updateNote,
    clearCart,
    subtotal,
    itemCount,
    uniqueCount: items.length,
  };
}
