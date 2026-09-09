import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import useRecentSearches from '../../hooks/useRecentSearches'
import RecentSearchChips from '../../components/RecentSearchChips'

function localizedCategory(p, lang) {
  return (lang === 'ar' ? p.category_ar : p.category_en) || p.category_en || p.category_ar
}

// entity = a product or a resolved variant (both carry is_offer_active,
// offer_price, price_tiers, and either `price`/`original_price` (variant) or
// just `price` (product, always the base)).
function resolvePrice(entity, qty = 1) {
  if (!entity) return 0
  if (entity.is_offer_active) return Number(entity.offer_price)
  const tiers = entity.price_tiers || []
  const tier = tiers.filter((t) => qty >= t.min_quantity && t.price != null).sort((a, b) => b.min_quantity - a.min_quantity)[0]
  if (tier) return Number(tier.price)
  return Number(entity.original_price ?? entity.price)
}

function originalPrice(entity) {
  return Number(entity?.original_price ?? entity?.price ?? 0)
}

export default function Orders() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'orders' ? 'orders' : 'shop')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({}) // key -> { productId, variantId, qty }
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const { terms: recentSearches, logSearch } = useRecentSearches('product')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [historyProduct, setHistoryProduct] = useState(null)
  const [shopProduct, setShopProduct] = useState(null)
  const [orderNotes, setOrderNotes] = useState('')

  useEffect(() => {
    Promise.all([api.get('/salon/orders'), api.get('/salon/products')])
      .then(([o, p]) => {
        setOrders(o.data.data ?? o.data)
        setProducts(p.data.data ?? p.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => localizedCategory(p, i18n.language)).filter(Boolean))]
    const list = ['all', ...cats.sort()]
    if (products.some((p) => p.has_offer)) list.push('__on_offer__')
    if (products.some((p) => p.has_price_breaks)) list.push('__price_breaks__')
    return list
  }, [products, i18n.language])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const byCategory =
      activeCategory === 'all' ? products
      : activeCategory === '__on_offer__' ? products.filter((p) => p.has_offer)
      : activeCategory === '__price_breaks__' ? products.filter((p) => p.has_price_breaks)
      : products.filter((p) => localizedCategory(p, i18n.language) === activeCategory)
    return term ? byCategory.filter((p) => p.name.toLowerCase().includes(term)) : byCategory
  }, [products, activeCategory, search, i18n.language])

  const updateCart = (key, meta, nextQty) => setCart((c) => {
    const next = Math.max(0, nextQty)
    if (next === 0) { const { [key]: _, ...rest } = c; return rest }
    return { ...c, [key]: { ...meta, qty: next } }
  })

  const plainQty = (productId) => cart[`p${productId}`]?.qty ?? 0
  const setPlainQty = (product, v) => updateCart(`p${product.id}`, { productId: product.id, variantId: null }, v)

  const cartVariantQty = (variantId) => cart[`v${variantId}`]?.qty ?? 0
  const addVariantToCart = (product, variant, addQty) => {
    const key = `v${variant.id}`
    const existing = cart[key]?.qty ?? 0
    updateCart(key, { productId: product.id, variantId: variant.id }, existing + addQty)
  }

  const addPlainToCart = (product, addQty) => {
    const key = `p${product.id}`
    const existing = cart[key]?.qty ?? 0
    updateCart(key, { productId: product.id, variantId: null }, existing + addQty)
  }

  const addToCart = (product, variant, addQty) =>
    variant ? addVariantToCart(product, variant, addQty) : addPlainToCart(product, addQty)

  const getCartQty = (product, variant) =>
    variant ? cartVariantQty(variant.id) : plainQty(product.id)

  const cartItems = useMemo(() => Object.entries(cart).map(([key, entry]) => {
    const product = products.find((p) => p.id === entry.productId)
    const variant = entry.variantId ? product?.variants?.find((v) => v.id === entry.variantId) : null
    return { key, product, variant, productId: entry.productId, variantId: entry.variantId, qty: entry.qty }
  }).filter((i) => i.product), [cart, products])

  const priceOf = (item) => resolvePrice(item.variant ?? item.product, item.qty ?? 1)
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cartItems.reduce((s, i) => s + priceOf(i) * i.qty, 0).toFixed(2)

  const placeOrder = async () => {
    if (!cartItems.length) return
    setPlacing(true)
    try {
      await api.post('/salon/orders', {
        items: cartItems.map((i) => ({ product_id: i.productId, product_variant_id: i.variantId ?? null, quantity: i.qty })),
        notes: orderNotes || undefined,
      })
      const res = await api.get('/salon/orders')
      setOrders(res.data.data ?? res.data)
      setCart({})
      setOrderNotes('')
      setSuccessMsg(t('orders.orderPlaced'))
      setTab('orders')
      setTimeout(() => setSuccessMsg(''), 4000)
    } finally {
      setPlacing(false)
    }
  }

  const cancelOrder = async (order) => {
    const isDirect = order.status === 'pending'
    const message = isDirect ? t('orders.cancelConfirm') : t('orders.requestCancelConfirm', { status: t('status.' + order.status) })
    if (!confirm(message)) return
    const { data } = await api.patch(`/salon/orders/${order.id}/cancel`)
    const updated = data.data ?? data
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
  }

  const requestReturn = async (orderId) => {
    if (!confirm(t('orders.requestReturnConfirm'))) return
    const { data } = await api.patch(`/salon/orders/${orderId}/request-return`)
    const updated = data.data ?? data
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
  }

  const onCartQtyChange = (item, nextQty) => {
    updateCart(item.key, { productId: item.productId, variantId: item.variantId }, nextQty)
  }

  return (
    <Layout>
      {/* Tab bar */}
      <div className="border-b border-gray-100 bg-white px-4 sm:px-8 flex items-center gap-1">
        {[{ id: 'shop', label: t('orders.shop') }, { id: 'orders', label: t('orders.myOrders') }].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? 'border-prima-green text-prima-dark'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {id === 'orders' && orders.length > 0 && (
              <span className="ms-1.5 text-xs bg-orange-100 text-orange-700 rounded-full px-1.5 py-0.5">{orders.length}</span>
            )}
          </button>
        ))}
      </div>

      {historyProduct && (
        <ProductModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}

      {shopProduct && (
        <ProductModal
          product={shopProduct}
          onClose={() => setShopProduct(null)}
          onAdd={addToCart}
          getCartQty={getCartQty}
        />
      )}

      {loading ? (
        <div className="p-8 text-gray-400">{t('common.loading')}</div>
      ) : tab === 'orders' ? (
        <OrdersTab orders={orders} successMsg={successMsg} onCancel={cancelOrder} onRequestReturn={requestReturn} onSelectProduct={setHistoryProduct} />
      ) : (
        <ShopTab
          products={filtered}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={(c) => setActiveCategory(c)}
          search={search}
          onSearch={setSearch}
          recentSearches={recentSearches}
          onLogSearch={logSearch}
          cartItems={cartItems}
          cartCount={cartCount}
          cartTotal={cartTotal}
          priceOf={priceOf}
          plainQty={plainQty}
          setPlainQty={setPlainQty}
          onPlaceOrder={placeOrder}
          placing={placing}
          onSelectProduct={setShopProduct}
          onChoosePicker={setShopProduct}
          onCartQtyChange={onCartQtyChange}
          notes={orderNotes}
          onNotesChange={setOrderNotes}
        />
      )}
    </Layout>
  )
}

function ShopTab({ products, categories, activeCategory, onCategory, search, onSearch, recentSearches, onLogSearch, cartItems, cartCount, cartTotal, priceOf, plainQty, setPlainQty, onPlaceOrder, placing, onSelectProduct, onChoosePicker, onCartQtyChange, notes, onNotesChange }) {
  const { t } = useTranslation()
  return (
    <>
      <div className="flex h-full">
        <div className="flex-1 min-w-0 p-4 sm:p-8 space-y-5 pb-24 lg:pb-8">
          <div className="space-y-2">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              onBlur={() => onLogSearch(search)}
              placeholder={t('orders.searchPlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            {!search && <RecentSearchChips terms={recentSearches} onSelect={onSearch} />}
          </div>

          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategory(cat)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-prima-orange text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat === 'all' ? t('orders.all') : cat === '__on_offer__' ? t('orders.onOfferFilter') : cat === '__price_breaks__' ? t('orders.priceBreaksFilter') : cat}
                </button>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <p className="text-gray-400">{t('orders.noProducts')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  qty={plainQty(p.id)}
                  setQty={(v) => setPlainQty(p, v)}
                  onSelect={() => onSelectProduct(p)}
                  onChoosePicker={() => onChoosePicker(p)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop cart sidebar */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 border-s border-gray-100 bg-white">
          <CartPanel cartItems={cartItems} cartTotal={cartTotal} priceOf={priceOf} onQtyChange={onCartQtyChange} onPlaceOrder={onPlaceOrder} placing={placing} notes={notes} onNotesChange={onNotesChange} />
        </div>
      </div>

      {/* Mobile sticky cart bar */}
      {cartCount > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-prima-dark text-white px-4 py-3 flex items-center justify-between shadow-2xl">
          <div>
            <p className="text-sm font-medium">{t('orders.items', { count: cartCount })}</p>
            <p className="text-xs text-white/80">{t('common.total')}: ${cartTotal}</p>
          </div>
          <button
            onClick={onPlaceOrder}
            disabled={placing}
            className="px-5 py-2 bg-prima-orange text-white text-sm font-semibold rounded-lg hover:bg-[#c93d15] disabled:opacity-50"
          >
            {placing ? t('common.placing') : t('orders.placeOrder')}
          </button>
        </div>
      )}
    </>
  )
}

function PriceDisplay({ entity, qty, size = 'base' }) {
  const { t } = useTranslation()
  const price = resolvePrice(entity, qty)
  const original = originalPrice(entity)
  const discounted = price < original
  const priceCls = size === 'lg' ? 'text-xl font-bold' : 'text-base font-bold'
  return (
    <div className="flex items-baseline gap-1.5 flex-wrap">
      <p className={`${priceCls} text-prima-orange`}>${price.toFixed(2)}</p>
      {discounted && <p className="text-xs text-gray-400 line-through">${original.toFixed(2)}</p>}
      {entity?.is_offer_active && (
        <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">{t('orders.saleTag')}</span>
      )}
    </div>
  )
}

function TierHints({ entity }) {
  const { t } = useTranslation()
  const tiers = (entity?.price_tiers ?? []).filter((tr) => tr.price != null)
  if (tiers.length === 0) return null
  return (
    <p className="text-xs text-gray-400 mb-3">
      {t('orders.tierHintLabel')} {tiers.map((tr) => `${tr.min_quantity}+: $${Number(tr.price).toFixed(2)}`).join(' · ')}
    </p>
  )
}

function MediaCarousel({ images, fallbackUrl, alt, className }) {
  const [index, setIndex] = useState(0)
  const items = images.length > 0 ? images : (fallbackUrl ? [{ id: 'main', type: 'image', url: fallbackUrl }] : [])

  if (items.length === 0) {
    return (
      <div className={`${className} bg-slate-50 flex items-center justify-center`}>
        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8l-2 4h12l-2-4z" />
        </svg>
      </div>
    )
  }

  const item = items[Math.min(index, items.length - 1)]

  return (
    <div className={`relative ${className} group/carousel overflow-hidden`}>
      {item.type === 'video' ? (
        <div className="w-full h-full flex items-center justify-center bg-prima-dark">
          <svg className="w-8 h-8 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      ) : (
        <img src={item.url} alt={alt} className="w-full h-full object-cover" />
      )}
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + items.length) % items.length) }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity flex items-center justify-center text-xs"
          >‹</button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % items.length) }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity flex items-center justify-center text-xs"
          >›</button>
          <div className="absolute bottom-1.5 inset-x-0 flex items-center justify-center gap-1">
            {items.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/60'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ProductCard({ product: p, qty, setQty, onSelect, onChoosePicker }) {
  const { t, i18n } = useTranslation()
  const hasVariants = (p.variants ?? []).length > 0
  const category = localizedCategory(p, i18n.language)

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer"
    >
      <MediaCarousel images={p.images ?? []} fallbackUrl={p.image_url} alt={p.name} className="w-full h-40" />

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {category && (
          <span className="self-start text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mb-1.5">
            {category}
          </span>
        )}
        <p className="font-semibold text-prima-dark text-sm leading-tight">{p.name}</p>
        {p.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 flex-1">{p.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <PriceDisplay entity={p} qty={qty || 1} size="base" />

          {hasVariants ? (
            <button
              onClick={onChoosePicker}
              className="px-3 py-1.5 bg-prima-orange hover:bg-[#c93d15] text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
            >
              {t('orders.chooseOptions')}
            </button>
          ) : qty === 0 ? (
            <button
              onClick={() => setQty(1)}
              disabled={p.stock === 0}
              className="px-3 py-1.5 bg-prima-orange hover:bg-[#c93d15] text-white text-xs font-medium rounded-lg disabled:opacity-40 shadow-sm transition-colors"
            >
              {p.stock === 0 ? t('orders.outOfStock') : t('common.add')}
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setQty(qty - 1)} className="w-7 h-7 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">−</button>
              <span className="w-6 text-center text-sm font-semibold text-prima-dark">{qty}</span>
              <button onClick={() => setQty(qty + 1)} disabled={qty >= p.stock} className="w-7 h-7 rounded-lg bg-prima-orange text-white font-bold text-sm flex items-center justify-center disabled:opacity-40">+</button>
            </div>
          )}
        </div>

        {!hasVariants && p.stock > 0 && p.stock <= 5 && (
          <p className="text-xs text-orange-500 mt-1">{t('orders.onlyLeft', { count: p.stock })}</p>
        )}
      </div>
    </div>
  )
}

function CartPanel({ cartItems, cartTotal, priceOf, onQtyChange, onPlaceOrder, placing, notes, onNotesChange }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-prima-dark">{t('orders.cart')}</h2>
      </div>

      {cartItems.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">{t('orders.emptyCart')}</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {cartItems.map((item) => {
              const entity = item.variant ?? item.product
              const price = priceOf(item)
              const discounted = price < originalPrice(entity)
              const variantLabel = item.variant ? (item.variant.attribute_values ?? []).map((av) => av.value).join(' / ') : null
              const maxStock = item.variant ? item.variant.stock : item.product.stock
              return (
                <div key={item.key} className="flex items-start gap-3">
                  {item.product.image_url && (
                    <img src={item.product.image_url} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-prima-dark truncate">{item.product.name}</p>
                    {variantLabel && <p className="text-xs text-gray-400 truncate">{variantLabel}</p>}
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span>${price.toFixed(2)} {t('orders.each')}</span>
                      {discounted && <span className="line-through">${originalPrice(entity).toFixed(2)}</span>}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button onClick={() => onQtyChange(item, item.qty - 1)} className="w-6 h-6 rounded bg-orange-50 hover:bg-orange-100 text-sm flex items-center justify-center">−</button>
                      <span className="text-sm w-5 text-center font-medium">{item.qty}</span>
                      <button onClick={() => onQtyChange(item, item.qty + 1)} disabled={item.qty >= maxStock} className="w-6 h-6 rounded bg-orange-50 hover:bg-orange-100 text-sm flex items-center justify-center disabled:opacity-40">+</button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-prima-dark shrink-0">${(price * item.qty).toFixed(2)}</p>
                </div>
              )
            })}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('orders.notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder={t('orders.notesPlaceholder')}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/40"
              />
            </div>
            <div className="flex justify-between text-sm font-bold text-prima-dark">
              <span>{t('common.total')}</span>
              <span>${cartTotal}</span>
            </div>
            <button
              onClick={onPlaceOrder}
              disabled={placing}
              className="w-full py-2.5 bg-prima-orange hover:bg-[#c93d15] text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {placing ? t('common.placing') : t('orders.placeOrder')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function OrdersTab({ orders, successMsg, onCancel, onRequestReturn, onSelectProduct }) {
  const { t } = useTranslation()
  return (
    <div className="p-4 sm:p-8 space-y-4 max-w-2xl">
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          {successMsg}
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-gray-400">{t('orders.noOrders')}</p>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-prima-dark">{t('orders.orderNumber', { id: o.id })}</span>
              <StatusBadge status={o.status} />
            </div>

            <OrderTimeline status={o.status} />

            <div className="text-sm text-gray-600 space-y-1.5 mt-4 pt-4 border-t border-gray-100">
              {o.items?.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.product && onSelectProduct(item.product)}
                  className={`flex items-center justify-between ${item.product ? 'cursor-pointer hover:text-prima-dark' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {item.product?.image_url ? (
                      <img src={item.product.image_url} alt="" className="w-7 h-7 rounded object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded bg-slate-100 shrink-0" />
                    )}
                    <div>
                      <span>{item.product?.name ?? `Product #${item.product_id}`} × {item.quantity}</span>
                      {item.variant && (
                        <p className="text-xs text-gray-400">{(item.variant.attribute_values ?? []).map((av) => av.value).join(' / ')}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-medium">${item.unit_price}</span>
                </div>
              ))}
            </div>
            {o.notes && (
              <p className="text-xs text-gray-400 italic mt-3 pt-3 border-t border-gray-100">{o.notes}</p>
            )}
            {o.return_reason && (
              <p className="text-xs text-gray-400 italic mt-3 pt-3 border-t border-gray-100">{t('orders.returnReason')}: {o.return_reason}</p>
            )}
            {o.cancellation_reason && (
              <p className="text-xs text-gray-400 italic mt-3 pt-3 border-t border-gray-100">{t('orders.cancelReason')}: {o.cancellation_reason}</p>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm font-bold text-prima-dark">
              <span>{t('common.total')}</span>
              <span>${o.total_amount}</span>
            </div>
            {(o.status === 'pending' || o.can_request_cancel) && (
              <button
                onClick={() => onCancel(o)}
                className="mt-3 w-full py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
              >
                {t('orders.cancelOrder')}
              </button>
            )}
            {o.status === 'delivered' && o.can_request_return && (
              <button
                onClick={() => onRequestReturn(o.id)}
                className="mt-3 w-full py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
              >
                {t('orders.requestReturn')}
              </button>
            )}
            {o.status === 'return_requested' && (
              <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg">
                {t('orders.returnPending')}
              </div>
            )}
            {o.status === 'cancellation_requested' && (
              <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg">
                {t('orders.cancelPending')}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const { t } = useTranslation()
  const map = {
    pending:   'bg-orange-100 text-orange-700',
    confirmed: 'bg-blue-100 text-blue-700',
    shipped:   'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    failed:    'bg-slate-200 text-slate-700',
    returned:  'bg-amber-100 text-amber-700',
    return_requested:       'bg-amber-100 text-amber-800',
    cancellation_requested: 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {t('status.' + status)}
    </span>
  )
}

const TIMELINE_STEPS = ['pending', 'confirmed', 'shipped', 'delivered']

function OrderTimeline({ status }) {
  const { t } = useTranslation()

  if (status === 'cancelled' || status === 'failed' || status === 'returned') {
    const color = status === 'returned' ? 'text-amber-600' : 'text-red-600'
    return (
      <p className={`text-xs font-medium ${color}`}>{t('status.' + status)}</p>
    )
  }

  const activeIndex = TIMELINE_STEPS.indexOf(status)

  return (
    <div className="flex rtl:flex-row-reverse items-start">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= activeIndex
        return (
          <div key={step} className="flex-1 flex flex-col items-center text-center">
            <div className="flex rtl:flex-row-reverse items-center w-full">
              <div className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : done ? 'bg-prima-green' : 'bg-gray-200'}`} />
              <div className={`w-3 h-3 rounded-full shrink-0 ${done ? 'bg-prima-green' : 'bg-gray-200'}`} />
              <div className={`h-0.5 flex-1 ${i === TIMELINE_STEPS.length - 1 ? 'opacity-0' : i < activeIndex ? 'bg-prima-green' : 'bg-gray-200'}`} />
            </div>
            <p className={`text-[11px] mt-1.5 ${done ? 'text-prima-dark font-semibold' : 'text-gray-400'}`}>
              {t('status.' + step)}
            </p>
            {i === activeIndex && (
              <p className="text-[10px] text-prima-orange mt-0.5">{t(`orders.timeline.${step}`)}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ProductModal({ product, onClose, onAdd, getCartQty }) {
  const { t, i18n } = useTranslation()
  const category = localizedCategory(product, i18n.language)
  const images = product.images ?? []
  const [activeImage, setActiveImage] = useState(0)
  const attributes = product.attributes ?? []
  const hasVariants = (product.variants ?? []).length > 0
  const [selected, setSelected] = useState({})
  const [qty, setQty] = useState(1)

  const resolvedVariant = useMemo(() => {
    if (!hasVariants) return null
    if (Object.keys(selected).length !== attributes.length) return null
    return (product.variants ?? []).find((v) =>
      attributes.every((attr) => (v.attribute_values ?? []).some((av) => av.attribute_id === attr.id && av.value_id === selected[attr.id]))
    ) ?? null
  }, [selected, product, attributes, hasVariants])

  const priceEntity = hasVariants ? resolvedVariant : product
  const effectiveStock = hasVariants ? resolvedVariant?.stock : product.stock
  const outOfStock = hasVariants ? (!!resolvedVariant && resolvedVariant.stock === 0) : product.stock === 0
  const isResolved = hasVariants ? !!resolvedVariant : true
  const canAdd = !!onAdd && isResolved && !outOfStock && qty > 0 && qty <= (effectiveStock ?? 0)

  const add = () => {
    if (!canAdd) return
    onAdd(product, hasVariants ? resolvedVariant : null, qty)
    onClose()
  }

  const cartQty = onAdd && isResolved ? getCartQty(product, hasVariants ? resolvedVariant : null) : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gallery */}
        <div className="shrink-0">
          {images.length > 0 ? (
            images[activeImage].type === 'video' ? (
              <video src={images[activeImage].url} controls className="w-full h-64 sm:h-72 object-cover bg-black" />
            ) : (
              <img src={images[activeImage].url} alt={product.name} className="w-full h-64 sm:h-72 object-cover" />
            )
          ) : product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-64 sm:h-72 object-cover" />
          ) : (
            <div className="w-full h-64 sm:h-72 bg-slate-50 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8l-2 4h12l-2-4z" />
              </svg>
            </div>
          )}
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-slate-50">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-prima-orange' : 'border-transparent'}`}
                >
                  {img.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-prima-dark">
                      <svg className="w-5 h-5 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  ) : (
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="font-bold text-prima-dark text-lg leading-tight">{product.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-prima-dark shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {category && (
            <span className="inline-block text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mb-3">
              {category}
            </span>
          )}

          {product.description && (
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{product.description}</p>
          )}

          {!onAdd ? (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <PriceDisplay entity={product} qty={1} size="lg" />
              {product.stock != null && (
                <span className="text-xs text-gray-400">{t('orders.stock')}: {product.stock}</span>
              )}
            </div>
          ) : (
            <>
              {hasVariants && attributes.map((attr) => (
                <div key={attr.id} className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">{attr.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {(attr.values ?? []).map((v) => {
                      const active = selected[attr.id] === v.id
                      return attr.type === 'color' ? (
                        <button
                          key={v.id}
                          onClick={() => setSelected((s) => ({ ...s, [attr.id]: v.id }))}
                          title={v.value}
                          className={`w-8 h-8 rounded-full border-2 transition-colors ${active ? 'border-prima-orange' : 'border-gray-200'}`}
                          style={{ background: v.swatch_hex || '#ccc' }}
                        />
                      ) : (
                        <button
                          key={v.id}
                          onClick={() => setSelected((s) => ({ ...s, [attr.id]: v.id }))}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${active ? 'bg-prima-orange text-white border-prima-orange' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {v.value}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {hasVariants && !isResolved ? (
                <p className="text-xs text-gray-400 mb-4">{t('orders.selectOptions')}</p>
              ) : outOfStock ? (
                <p className="text-xs text-red-500 mb-4">{t('orders.combinationOutOfStock')}</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1 pt-3 border-t border-gray-100">
                    <PriceDisplay entity={priceEntity} qty={qty} size="lg" />
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-7 h-7 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">−</button>
                      <span className="w-6 text-center text-sm font-semibold text-prima-dark">{qty}</span>
                      <button onClick={() => setQty((q) => Math.min(effectiveStock, q + 1))} disabled={qty >= effectiveStock} className="w-7 h-7 rounded-lg bg-prima-orange text-white font-bold text-sm flex items-center justify-center disabled:opacity-40">+</button>
                    </div>
                  </div>
                  <TierHints entity={priceEntity} />
                </>
              )}

              {cartQty > 0 && (
                <p className="text-xs text-gray-400 mb-2">{t('orders.items', { count: cartQty })} {t('orders.cart').toLowerCase()}</p>
              )}
              <button
                onClick={add}
                disabled={!canAdd}
                className="w-full py-2.5 bg-prima-orange hover:bg-[#c93d15] text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-40 transition-colors"
              >
                {t('common.add')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
