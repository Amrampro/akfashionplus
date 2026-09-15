import { useContext } from "react";
import { CartContext, type CartItem } from "../contexts/CartContext";

export type { CartItem };

export function useCart() {
  return useContext(CartContext);
}
