import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import { createProduct, updateProduct, deleteProduct } from '../../api/products'
import Layout from '../../components/Layout'
import ProductForm from './ProductForm'

export default function Products() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)

  const load = () => api.get('admin/products', { params: { per_page: 100 } }).then(({ data }) => setProducts(data.data ?? data))
  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setShowForm(true)
  }

  const onSubmit = async (data) => {
    if (editing) {
      await updateProduct(editing.id, data)
      setShowForm(false)
      load()
    } else {
      const created = await createProduct(data)
      navigate(`/products/${created.id}`)
    }
  }

  const destroy = async (id) => {
    if (!confirm(t('products.deleteConfirm'))) return
    await deleteProduct(id)
    load()
  }

  const uploadImage = async (productId, file) => {
    if (!file) return
    setUploadingId(productId)
    const form = new FormData()
    form.append('image', file)
    try {
      await api.post(`admin/products/${productId}/image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      load()
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-prima-dark">{t('products.title')}</h1>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg shadow-sm font-medium transition-colors"
          >
            {t('products.addProduct')}
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-prima-dark mb-4">{editing ? t('products.editProduct') : t('products.newProduct')}</h2>
            <ProductForm
              defaultValues={editing
                ? { name: editing.name, description: editing.description ?? '', price: editing.price, client_price: editing.client_price, stock: editing.stock, category_en: editing.category_en ?? '', category_ar: editing.category_ar ?? '' }
                : { name: '', description: '', price: '', client_price: '', stock: '', category_en: '', category_ar: '' }}
              onSubmit={onSubmit}
              onCancel={() => setShowForm(false)}
              hasVariants={(editing?.variants_count ?? 0) > 0}
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <Link to={`/products/${p.id}`} className="block">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-slate-50 flex items-center justify-center text-gray-300 text-sm">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8l-2 4h12l-2-4z" />
                    </svg>
                  </div>
                )}
              </Link>
              <div className="p-4">
                <Link to={`/products/${p.id}`} className="block">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-semibold text-prima-dark hover:text-prima-orange transition-colors">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.category_en && (
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block">
                            {p.category_en}
                          </span>
                        )}
                        {p.category_ar && (
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block" dir="rtl">
                            {p.category_ar}
                          </span>
                        )}
                        {p.variants_count > 0 && (
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                            {t('products.variantsCount', { count: p.variants_count })}
                          </span>
                        )}
                        {p.is_offer_active && (
                          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-block">
                            {t('products.onOffer')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="font-bold text-prima-orange">${p.client_price}</p>
                      <p className="text-[11px] text-gray-400">{t('products.salonPriceInline', { price: p.price })}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('products.stockLabel', { count: p.stock })}</p>
                  {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                </Link>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditing(p); setShowForm(true) }} className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">{t('products.edit')}</button>
                  <button onClick={(e) => { e.stopPropagation(); destroy(p.id) }} className="text-xs px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors">{t('products.delete')}</button>
                  <label onClick={(e) => e.stopPropagation()} className="text-xs px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer transition-colors">
                    {uploadingId === p.id ? t('products.uploading') : t('products.uploadImage')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadImage(p.id, e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
