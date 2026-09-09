import { create } from 'zustand';
import { resolvePrice } from '../utils/pricing';

const keyFor = (productId, variantId) => (variantId ? `v${variantId}` : `p${productId}`);

const useCartStore = create((set, get) => ({
  items: [], // [{ product, variant, quantity }]

  addItem: (product, variant = null) => {
    const { items } = get();
    const key = keyFor(product.id, variant?.id);
    const stock = variant ? variant.stock : product.stock;
    const existing = items.find((i) => keyFor(i.product.id, i.variant?.id) === key);
    if (existing) {
      set({
        items: items.map((i) =>
          keyFor(i.product.id, i.variant?.id) === key
            ? { ...i, quantity: Math.min(i.quantity + 1, stock) }
            : i
        ),
      });
    } else {
      set({ items: [...items, { product, variant, quantity: 1 }] });
    }
  },

  addItems: (product, variant, qty) => {
    const { items } = get();
    const key = keyFor(product.id, variant?.id);
    const stock = variant ? variant.stock : product.stock;
    const existing = items.find((i) => keyFor(i.product.id, i.variant?.id) === key);
    if (existing) {
      set({
        items: items.map((i) =>
          keyFor(i.product.id, i.variant?.id) === key
            ? { ...i, quantity: Math.min(i.quantity + qty, stock) }
            : i
        ),
      });
    } else {
      set({ items: [...items, { product, variant, quantity: Math.min(qty, stock) }] });
    }
  },

  updateQuantity: (productId, variantId, quantity) => {
    const { items } = get();
    const key = keyFor(productId, variantId);
    if (quantity <= 0) {
      set({ items: items.filter((i) => keyFor(i.product.id, i.variant?.id) !== key) });
      return;
    }
    set({
      items: items.map((i) => {
        if (keyFor(i.product.id, i.variant?.id) !== key) return i;
        const stock = i.variant ? i.variant.stock : i.product.stock;
        return { ...i, quantity: Math.min(quantity, stock) };
      }),
    });
  },

  removeItem: (productId, variantId) => {
    const key = keyFor(productId, variantId);
    set({ items: get().items.filter((i) => keyFor(i.product.id, i.variant?.id) !== key) });
  },

  clear: () => set({ items: [] }),

  totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  totalAmount: () => get().items.reduce((sum, i) => {
    const price = resolvePrice(i.variant ?? i.product, i.quantity);
    return sum + i.quantity * price;
  }, 0),
}));

export default useCartStore;
export { keyFor };
