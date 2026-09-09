import { create } from 'zustand';
import { resolvePrice } from '../components/PriceDisplay';

const keyFor = (productId, variantId) => (variantId ? `v${variantId}` : `p${productId}`);

function priceOf(item) {
  return resolvePrice(item.variant ?? item.product, item.quantity ?? 1);
}

function stockOf(item) {
  return item.variant ? item.variant.stock : item.product.stock;
}

const useCartStore = create((set, get) => ({
  items: [], // [{ product, variant, quantity }]
  notes: '',

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
        return { ...i, quantity: Math.min(quantity, stockOf(i)) };
      }),
    });
  },

  getQuantity: (productId, variantId) => {
    const key = keyFor(productId, variantId);
    return get().items.find((i) => keyFor(i.product.id, i.variant?.id) === key)?.quantity ?? 0;
  },

  setNotes: (notes) => set({ notes }),

  clear: () => set({ items: [], notes: '' }),

  totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  totalAmount: () => get().items.reduce((sum, i) => sum + i.quantity * Number(priceOf(i)), 0),
}));

export default useCartStore;
export { keyFor, priceOf, stockOf };
