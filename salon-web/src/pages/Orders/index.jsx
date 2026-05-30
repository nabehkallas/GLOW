import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function Orders() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('shop')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    Promise.all([api.get('/salon/orders'), api.get('/salon/products')])
      .then(([o, p]) => {
        setOrders(o.data.data ?? o.data)
        setProducts(p.data.data ?? p.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const cats = [...new Set(products.filter((p) => p.category).map((p) => p.category))]
    return ['all', ...cats.sort()]
  }, [products])

  const filtered = useMemo(
    () => activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory),
    [products, activeCategory]
  )

  const qty = (id) => cart[id] ?? 0
  const setQty = (id, v) => setCart((c) => {
    const next = Math.max(0, v)
    if (next === 0) { const { [id]: _, ...rest } = c; return rest }
    return { ...c, [id]: next }
  })

  const cartItems = useMemo(
    () => products.filter((p) => (cart[p.id] ?? 0) > 0).map((p) => ({ ...p, qty: cart[p.id] })),
    [products, cart]
  )
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)

  const placeOrder = async () => {
    if (!cartItems.length) return
    setPlacing(true)
    try {
      await api.post('/salon/orders', {
        items: cartItems.map(({ id, qty }) => ({ product_id: id, quantity: qty })),
      })
      const res = await api.get('/salon/orders')
      setOrders(res.data.data ?? res.data)
      setCart({})
      setSuccessMsg(t('orders.orderPlaced'))
      setTab('orders')
      setTimeout(() => setSuccessMsg(''), 4000)
    } finally {
      setPlacing(false)
    }
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

      {loading ? (
        <div className="p-8 text-gray-400">{t('common.loading')}</div>
      ) : tab === 'orders' ? (
        <OrdersTab orders={orders} successMsg={successMsg} />
      ) : (
        <ShopTab
          products={filtered}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={(c) => setActiveCategory(c)}
          cartItems={cartItems}
          cartCount={cartCount}
          cartTotal={cartTotal}
          qty={qty}
          setQty={setQty}
          onPlaceOrder={placeOrder}
          placing={placing}
        />
      )}
    </Layout>
  )
}

function ShopTab({ products, categories, activeCategory, onCategory, cartItems, cartCount, cartTotal, qty, setQty, onPlaceOrder, placing }) {
  const { t } = useTranslation()
  return (
    <>
      <div className="flex h-full">
        <div className="flex-1 min-w-0 p-4 sm:p-8 space-y-5 pb-24 lg:pb-8">
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
                  {cat === 'all' ? t('orders.all') : cat}
                </button>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <p className="text-gray-400">{t('orders.noProducts')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} qty={qty(p.id)} setQty={(v) => setQty(p.id, v)} />
              ))}
            </div>
          )}
        </div>

        {/* Desktop cart sidebar */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 border-s border-gray-100 bg-white">
          <CartPanel cartItems={cartItems} cartTotal={cartTotal} onQtyChange={setQty} onPlaceOrder={onPlaceOrder} placing={placing} />
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

function ProductCard({ product: p, qty, setQty }) {
  const { t } = useTranslation()
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {p.image_url ? (
        <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-slate-50 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8l-2 4h12l-2-4z" />
          </svg>
        </div>
      )}

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {p.category && (
          <span className="self-start text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mb-1.5">
            {p.category}
          </span>
        )}
        <p className="font-semibold text-prima-dark text-sm leading-tight">{p.name}</p>
        {p.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 flex-1">{p.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-base font-bold text-prima-orange">${p.price}</p>

          {qty === 0 ? (
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

        {p.stock > 0 && p.stock <= 5 && (
          <p className="text-xs text-orange-500 mt-1">{t('orders.onlyLeft', { count: p.stock })}</p>
        )}
      </div>
    </div>
  )
}

function CartPanel({ cartItems, cartTotal, onQtyChange, onPlaceOrder, placing }) {
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
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-prima-dark truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">${item.price} {t('orders.each')}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button onClick={() => onQtyChange(item.id, item.qty - 1)} className="w-6 h-6 rounded bg-orange-50 hover:bg-orange-100 text-sm flex items-center justify-center">−</button>
                    <span className="text-sm w-5 text-center font-medium">{item.qty}</span>
                    <button onClick={() => onQtyChange(item.id, item.qty + 1)} className="w-6 h-6 rounded bg-orange-50 hover:bg-orange-100 text-sm flex items-center justify-center">+</button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-prima-dark shrink-0">${(item.price * item.qty).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
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

function OrdersTab({ orders, successMsg }) {
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
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-prima-dark">{t('orders.orderNumber', { id: o.id })}</span>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-sm text-gray-600 space-y-1.5">
              {o.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.product?.image_url && (
                      <img src={item.product.image_url} alt="" className="w-7 h-7 rounded object-cover" />
                    )}
                    <span>{item.product?.name ?? `Product #${item.product_id}`} × {item.quantity}</span>
                  </div>
                  <span className="font-medium">${item.unit_price}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm font-bold text-prima-dark">
              <span>{t('common.total')}</span>
              <span>${o.total_amount}</span>
            </div>
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
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {t('status.' + status)}
    </span>
  )
}
