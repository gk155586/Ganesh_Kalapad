import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface WishlistState {
  items: string[]; // productIds
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      fetchWishlist: async () => {
        try {
          const { data } = await api.get("/api/wishlist");
          const ids = data.map((item: any) => item.productId);
          set({ items: ids });
        } catch {
          // not authenticated or error — leave as is
        }
      },

      toggle: async (productId: string) => {
        const current = get().items;
        const alreadyIn = current.includes(productId);

        // Optimistic update
        set({ items: alreadyIn ? current.filter((id) => id !== productId) : [...current, productId] });

        try {
          await api.post("/api/wishlist/toggle", { productId });
        } catch {
          // Revert on failure
          set({ items: current });
          toast.error("Failed to update wishlist");
        }
      },

      isWishlisted: (productId: string) => get().items.includes(productId),
    }),
    { name: "freshin10-wishlist" }
  )
);
