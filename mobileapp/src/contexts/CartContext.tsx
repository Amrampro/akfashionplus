import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItemType = "purchase" | "rental";

export type CartItem = {
  key: string;
  product_id: number;
  product_name: string;
  product_slug?: string | null;
  product_image_url?: string | null;
  variant_id?: number | null;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  item_type: CartItemType;
  quantity: number;
  unit_price_eur: number;
  unit_price_secondary?: number | null;
  rental_days?: number | null;
  rental_price_per_day_eur?: number | null;
  rental_deposit_eur?: number | null;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
};

type CartInput = Omit<CartItem, "key">;

type CartContextValue = {
  count: number;
  items: CartItem[];
  subtotal: number;
  addItem: (item: CartInput) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

export const CartContext = createContext<CartContextValue>({
  count: 0,
  items: [],
  subtotal: 0,
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
});

function cartKey(item: CartInput) {
  return [
    item.product_id,
    item.variant_id || "default",
    item.item_type,
    item.rental_days || "sale",
  ].join(":");
}

function lineTotal(item: CartItem) {
  if (item.item_type === "rental") {
    return (
      item.quantity *
      (Number(item.rental_days || 1) * Number(item.rental_price_per_day_eur || item.unit_price_eur) +
        Number(item.rental_deposit_eur || 0))
    );
  }

  return item.quantity * item.unit_price_eur;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CartInput) => {
    const key = cartKey(item);
    setItems((current) => {
      const existing = current.find((row) => row.key === key);
      if (!existing) {
        return [{ ...item, key, quantity: Math.max(1, item.quantity || 1) }, ...current];
      }

      return current.map((row) =>
        row.key === key
          ? { ...row, quantity: row.quantity + Math.max(1, item.quantity || 1) }
          : row,
      );
    });
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.key === key ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      items,
      subtotal: items.reduce((sum, item) => sum + lineTotal(item), 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, items, removeItem, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
