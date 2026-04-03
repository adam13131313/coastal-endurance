import { useCartSync } from "@/hooks/useCartSync";

const CartSyncInitializer = () => {
  useCartSync();

  return null;
};

export default CartSyncInitializer;