import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import toast from "react-hot-toast";

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  mrp: number;
  images: string[];
  unit: string;
  inventory?: { stock: number };
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean;

  // Computed
  itemCount: () => number;
  subtotal: () => number;

  // Actions
  setItems: (items: CartItem[]) => void;
  addItem: (productId: string, quantity?: number, productData?: any) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  syncCart: () => Promise<void>;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isOpen: false,

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),

      setItems: (items) => set({ items }),

      fetchCart: async () => {
        if (typeof window === "undefined") return;
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        try {
          set({ isLoading: true });
          const { data } = await api.get("/api/cart");
          set({ items: data.items || [] });
        } catch (error) {
          console.error("Fetch cart error:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      syncCart: async () => {
        if (typeof window === "undefined") return;
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        const { items } = get();
        try {
          set({ isLoading: true });
          // Transfer local items to backend
          if (items.length > 0) {
            for (const item of items) {
              if (item.productId && !item.id.startsWith('local-')) {
                 // already synced? 
              }
              await api.post("/api/cart/add", { 
                productId: item.productId, 
                quantity: item.quantity 
              }).catch(() => {});
            }
          }
          // Get the final merged cart from backend
          const { data } = await api.get("/api/cart");
          set({ items: data.items || [] });
        } catch (error) {
          console.error("Sync cart error:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (productId, quantity = 1, productData) => {
        try {
          if (typeof window === "undefined") return;
          const accessToken = localStorage.getItem("accessToken");
          let newItem: any = null;

          if (accessToken) {
            const { data } = await api.post("/api/cart/add", { productId, quantity });
            newItem = data;
          } else {
            if (!productData) throw new Error("Product data required for guest cart");
            newItem = {
              id: `local-${productId}`,
              productId,
              quantity,
              product: productData,
            };
          }

          set((state) => {
            const existing = state.items.find((i) => i.productId === productId);
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
                ),
              };
            }
            return { items: [...state.items, newItem] };
          });

          toast.success("Added to cart");
        } catch (err: any) {
          toast.error(err.response?.data?.error || err.message || "Failed to add item");
        }
      },

      updateItem: async (productId, quantity) => {
        try {
          if (typeof window === "undefined") return;
          const accessToken = localStorage.getItem("accessToken");
          if (accessToken) {
            await api.put("/api/cart/update", { productId, quantity });
          }

          if (quantity === 0) {
            set((state) => ({
              items: state.items.filter((i) => i.productId !== productId),
            }));
          } else {
            set((state) => ({
              items: state.items.map((i) =>
                i.productId === productId ? { ...i, quantity } : i
              ),
            }));
          }
        } catch (err: any) {
          toast.error(err.response?.data?.error || "Failed to update cart");
        }
      },

      removeItem: async (productId) => {
        try {
          if (typeof window === "undefined") return;
          const accessToken = localStorage.getItem("accessToken");
          if (accessToken) {
            await api.delete(`/api/cart/remove/${productId}`);
          }
          set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
          }));
          toast.success("Removed from cart");
        } catch {
          toast.error("Failed to remove item");
        }
      },

      clearCart: async () => {
        try {
          if (typeof window === "undefined") return;
          const accessToken = localStorage.getItem("accessToken");
          if (accessToken) {
            await api.delete("/api/cart/clear");
          }
          set({ items: [] });
        } catch {
          toast.error("Failed to clear cart");
        }
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setCartOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: "freshin10-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
