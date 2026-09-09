import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, X } from 'lucide-react'
import {
  getProduct, updateProduct, deleteProduct,
  createAttribute, deleteAttribute, addAttributeValue, deleteAttributeValue,
  generateVariants, bulkUpdateVariants, deleteVariant,
  addProductImage, deleteProductImage,
  addProductStock, directSellProduct,
  setProductOffer, setVariantOffer, saveProductPriceTiers, saveVariantPriceTiers,
} from '../../api/products'
import { getSalons } from '../../api/cashier'
import Layout from '../../components/Layout'
import ProductForm from '../Products/ProductForm'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingInfo, setEditingInfo] = useState(false)
  const [addingAttr, setAddingAttr] = useState(false)
  const [variantRows, setVariantRows] = useState([])
  const [savingVariants, setSavingVariants] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [stockModal, setStockModal] = useState(null) // 'add' | 'sell' | null
  const [pricingVariant, setPricingVariant] = useState(null) // variant object | null
  const [lightboxImage, setLightboxImage] = useState(null) // image/video object | null

  const load = () => {
    setLoading(true)
    return getProduct(id).then((p) => { setProduct(p); setVariantRows(p.variants ?? []) }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const saveInfo = async (data) => {
    await updateProduct(id, data)
    setEditingInfo(false)
    load()
  }

  const remove = async () => {
    if (!confirm(t('products.deleteConfirm'))) return
    await deleteProduct(id)
    navigate('/products')
  }

  const uploadPhoto = async (file) => {
    if (!file) return
    setUploadingPhoto(true)
    try {
      await addProductImage(id, file)
      load()
    } finally {
      setUploadingPhoto(false)
    }
  }

  const removePhoto = async (imageId) => {
    if (!confirm(t('productDetail.deletePhotoConfirm'))) return
    await deleteProductImage(id, imageId)
    load()
  }

  const addAttr = async (data) => {
    await createAttribute(id, data)
    setAddingAttr(false)
    load()
  }

  const removeAttr = async (attrId) => {
    if (!confirm(t('productDetail.deleteAttributeConfirm'))) return
    await deleteAttribute(id, attrId)
    load()
  }

  const addValue = async (attrId, value, swatch_hex) => {
    if (!value) return
    await addAttributeValue(id, attrId, { value, swatch_hex: swatch_hex || null })
    load()
  }

  const removeValue = async (valueId) => {
    if (!confirm(t('productDetail.deleteValueConfirm'))) return
    await deleteAttributeValue(id, valueId)
    load()
  }

  const doGenerate = async () => {
    const rows = await generateVariants(id)
    setVariantRows(rows)
  }

  const updateRow = (variantId, patch) => {
    setVariantRows((rows) => rows.map((r) => (r.id === variantId ? { ...r, ...patch } : r)))
  }

  const saveVariants = async () => {
    setSavingVariants(true)
    try {
      const rows = await bulkUpdateVariants(id, variantRows.map((r) => ({
        id: r.id, sku: r.sku, stock: r.stock, price: r.price, client_price: r.client_price, is_active: r.is_active,
      })))
      setVariantRows(rows)
    } finally {
      setSavingVariants(false)
    }
  }

  const removeVariant = async (variantId) => {
    if (!confirm(t('productDetail.deleteVariantConfirm'))) return
    await deleteVariant(id, variantId)
    setVariantRows((rows) => rows.filter((r) => r.id !== variantId))
  }

  if (loading || !product) {
    return <Layout><div className="p-8 text-gray-400">{t('common.loading')}</div></Layout>
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link to="/products" className="text-sm text-gray-400 hover:text-prima-dark inline-flex items-center gap-1 mb-2">
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('productDetail.back')}
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              {product.image_url && <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
              <h1 className="text-2xl font-bold text-prima-dark">{product.name}</h1>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Btn color="blue" onClick={() => setStockModal('add')}>{t('productDetail.addStock')}</Btn>
            <Btn color="green" onClick={() => setStockModal('sell')}>{t('productDetail.directSell')}</Btn>
            <Btn color="gray" onClick={() => setEditingInfo(true)}>{t('productDetail.edit')}</Btn>
            <Btn color="red" onClick={remove}>{t('productDetail.delete')}</Btn>
          </div>
        </div>

        {/* Core info card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6">
          {editingInfo ? (
            <ProductForm
              defaultValues={{ name: product.name, description: product.description ?? '', price: product.price, client_price: product.client_price, stock: product.stock, category_en: product.category_en ?? '', category_ar: product.category_ar ?? '' }}
              onSubmit={saveInfo}
              onCancel={() => setEditingInfo(false)}
              hasVariants={variantRows.length > 0}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <Field label={t('products.salonPrice')} value={`$${product.price}`} />
              <Field label={t('products.clientPrice')} value={`$${product.client_price}`} />
              <Field
                label={t('products.stock')}
                value={product.stock}
                sub={variantRows.length > 0 ? t('products.stockManagedByVariants') : null}
              />
              <Field label={t('products.categoryEn')} value={product.category_en ?? '—'} />
              <Field label={t('products.categoryAr')} value={product.category_ar ?? '—'} />
              {product.description && <Field label={t('products.description')} value={product.description} />}
            </div>
          )}
        </div>

        {/* Special Offer card */}
        <OfferCard
          key={`offer-${product.id}-${product.offer_price ?? 'none'}`}
          title={t('productDetail.specialOffer')}
          hint={variantRows.length > 0 ? t('productDetail.offerDefaultHint') : null}
          initial={product}
          onSave={(data) => setProductOffer(product.id, data).then(() => load())}
        />

        {/* Price Breaks card */}
        <PriceTiersCard
          key={`tiers-${product.id}-${(product.price_tiers ?? []).length}`}
          title={t('productDetail.priceBreaks')}
          hint={variantRows.length > 0 ? t('productDetail.tiersDefaultHint') : null}
          initialTiers={product.price_tiers ?? []}
          onSave={(tiers) => saveProductPriceTiers(product.id, tiers).then(() => load())}
        />

        {/* Photos card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
            <span className="font-semibold text-prima-dark">{t('productDetail.photos')}</span>
          </div>
          <div className="p-5 sm:p-6 flex flex-wrap gap-3">
            {(product.images ?? []).map((img) => (
              <div key={img.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-100 group cursor-zoom-in" onClick={() => setLightboxImage(img)}>
                {img.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-prima-dark">
                    <svg className="w-8 h-8 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                ) : (
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(img.id) }}
                  className="absolute top-1 end-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label title={t('productDetail.addPhoto')} className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-prima-orange hover:border-prima-orange cursor-pointer transition-colors">
              {uploadingPhoto ? (
                <span className="text-xs">{t('products.uploading')}</span>
              ) : (
                <Plus className="w-6 h-6" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={(e) => uploadPhoto(e.target.files?.[0])}
              />
            </label>
          </div>
          <p className="px-5 sm:px-6 pb-4 -mt-1 text-xs text-gray-400">{t('productDetail.photosHint')}</p>
        </div>

        {/* Attributes card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-prima-dark">{t('productDetail.attributes')}</span>
            <button onClick={() => setAddingAttr(true)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 inline-flex items-center gap-1 transition-colors">
              <Plus className="w-3.5 h-3.5" /> {t('productDetail.addAttribute')}
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {addingAttr && <NewAttributeForm t={t} onSubmit={addAttr} onCancel={() => setAddingAttr(false)} />}

            {(product.attributes ?? []).length === 0 && !addingAttr && (
              <p className="text-gray-400 text-sm">{t('productDetail.noAttributesYet')}</p>
            )}

            {(product.attributes ?? []).map((attr) => (
              <AttributeRow key={attr.id} t={t} attr={attr} onDeleteAttr={() => removeAttr(attr.id)} onAddValue={(v, hex) => addValue(attr.id, v, hex)} onDeleteValue={removeValue} />
            ))}
          </div>
        </div>

        {/* Variants card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-prima-dark">{t('productDetail.variants')}</span>
            {(product.attributes ?? []).length > 0 && (
              <button onClick={doGenerate} className="text-xs px-3 py-1.5 rounded-lg bg-prima-orange hover:bg-[#c93d15] text-white font-medium transition-colors">
                {t('productDetail.generateVariants')}
              </button>
            )}
          </div>

          {(product.attributes ?? []).length === 0 ? (
            <p className="text-gray-400 text-sm p-5 sm:p-6">{t('productDetail.addAttributesFirst')}</p>
          ) : variantRows.length === 0 ? (
            <p className="text-gray-400 text-sm p-5 sm:p-6">{t('productDetail.noVariantsYet')}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                    <tr>
                      {[t('productDetail.combination'), t('productDetail.sku'), t('products.stock'), t('productDetail.priceOverride'), t('productDetail.clientPriceOverride'), t('productDetail.active'), ''].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-start whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {variantRows.map((v) => (
                      <tr key={v.id} className="border-t border-gray-100">
                        <td className="px-4 py-2.5 font-medium text-prima-dark whitespace-nowrap">
                          {(v.attribute_values ?? []).map((av) => av.value).join(' / ')}
                        </td>
                        <td className="px-4 py-2.5">
                          <input value={v.sku ?? ''} onChange={(e) => updateRow(v.id, { sku: e.target.value })} className={cellInp} />
                        </td>
                        <td className="px-4 py-2.5">
                          <input type="number" value={v.stock ?? 0} onChange={(e) => updateRow(v.id, { stock: Number(e.target.value) })} className={`${cellInp} w-20`} />
                        </td>
                        <td className="px-4 py-2.5">
                          <input type="number" step="0.01" value={v.price ?? ''} placeholder={String(product.price)} onChange={(e) => updateRow(v.id, { price: e.target.value === '' ? null : Number(e.target.value) })} className={`${cellInp} w-24`} />
                        </td>
                        <td className="px-4 py-2.5">
                          <input type="number" step="0.01" value={v.client_price ?? ''} placeholder={String(product.client_price)} onChange={(e) => updateRow(v.id, { client_price: e.target.value === '' ? null : Number(e.target.value) })} className={`${cellInp} w-24`} />
                        </td>
                        <td className="px-4 py-2.5">
                          <input type="checkbox" checked={!!v.is_active} onChange={(e) => updateRow(v.id, { is_active: e.target.checked })} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setPricingVariant(v)} className="text-[11px] px-2 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 whitespace-nowrap transition-colors">
                              {t('productDetail.pricing')}
                              {(v.is_offer_active || (v.price_tiers ?? []).length > 0) && (
                                <span className="ms-1 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
                              )}
                            </button>
                            <button onClick={() => removeVariant(v.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 sm:px-6 py-4 border-t border-gray-100">
                <button onClick={saveVariants} disabled={savingVariants} className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors">
                  {savingVariants ? t('common.saving') : t('productDetail.saveChanges')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {stockModal && (
        <StockActionModal
          product={product}
          mode={stockModal}
          onClose={() => setStockModal(null)}
          onSaved={() => { setStockModal(null); load() }}
        />
      )}

      {pricingVariant && (
        <VariantPricingModal
          product={product}
          variant={pricingVariant}
          onClose={() => setPricingVariant(null)}
          onSaved={() => { setPricingVariant(null); load() }}
        />
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 end-4 text-white/80 hover:text-white"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          {lightboxImage.type === 'video' ? (
            <video
              src={lightboxImage.url}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightboxImage.url}
              alt=""
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </Layout>
  )
}

function NewAttributeForm({ t, onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('text')
  const [values, setValues] = useState([{ value: '', swatch_hex: '' }])

  const setValueAt = (i, patch) => setValues((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)))
  const addRow = () => setValues((vs) => [...vs, { value: '', swatch_hex: '' }])
  const removeRow = (i) => setValues((vs) => vs.filter((_, idx) => idx !== i))

  const submit = (e) => {
    e.preventDefault()
    const cleaned = values.filter((v) => v.value.trim())
    if (!name.trim() || cleaned.length === 0) return
    onSubmit({ name: name.trim(), type, values: cleaned.map((v) => ({ value: v.value.trim(), swatch_hex: type === 'color' ? (v.swatch_hex || null) : null })) })
  }

  return (
    <form onSubmit={submit} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-prima-dark mb-1">{t('productDetail.attributeName')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Color" />
        </div>
        <div>
          <label className="block text-xs font-medium text-prima-dark mb-1">{t('productDetail.attributeType')}</label>
          <div className="flex gap-3 items-center h-[38px]">
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" checked={type === 'text'} onChange={() => setType('text')} /> {t('productDetail.typeText')}
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" checked={type === 'color'} onChange={() => setType('color')} /> {t('productDetail.typeColor')}
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-prima-dark mb-1">{t('productDetail.values')}</label>
        <div className="space-y-2">
          {values.map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={v.value} onChange={(e) => setValueAt(i, { value: e.target.value })} className={`${inp} flex-1`} placeholder={t('productDetail.values')} />
              {type === 'color' && (
                <input type="color" value={v.swatch_hex || '#000000'} onChange={(e) => setValueAt(i, { swatch_hex: e.target.value })} className="w-9 h-9 rounded border border-gray-200 cursor-pointer" />
              )}
              {values.length > 1 && (
                <button type="button" onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addRow} className="text-xs text-prima-orange hover:underline mt-2 inline-flex items-center gap-1">
          <Plus className="w-3 h-3" /> {t('productDetail.addValue')}
        </button>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg font-medium transition-colors">{t('common.save')}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">{t('common.cancel')}</button>
      </div>
    </form>
  )
}

function AttributeRow({ t, attr, onDeleteAttr, onAddValue, onDeleteValue }) {
  const [addingValue, setAddingValue] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [newHex, setNewHex] = useState('#000000')

  const submitValue = () => {
    if (!newValue.trim()) return
    onAddValue(newValue.trim(), attr.type === 'color' ? newHex : null)
    setNewValue('')
    setAddingValue(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-prima-dark text-sm">{attr.name}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-gray-500">
            {attr.type === 'color' ? t('productDetail.typeColor') : t('productDetail.typeText')}
          </span>
        </div>
        <button onClick={onDeleteAttr} className="text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {(attr.values ?? []).map((v) => (
          <span key={v.id} className="inline-flex items-center gap-1.5 text-xs bg-slate-100 px-2.5 py-1 rounded-full">
            {v.swatch_hex && <span className="w-3 h-3 rounded-full border border-gray-300" style={{ background: v.swatch_hex }} />}
            {v.value}
            <button onClick={() => onDeleteValue(v.id)} className="text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {addingValue ? (
          <div className="flex items-center gap-1.5">
            <input value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitValue()} className="text-xs border border-gray-200 rounded-full px-2.5 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-orange-400" autoFocus />
            {attr.type === 'color' && <input type="color" value={newHex} onChange={(e) => setNewHex(e.target.value)} className="w-7 h-7 rounded border border-gray-200 cursor-pointer" />}
            <button onClick={submitValue} className="text-xs text-prima-orange hover:underline">{t('common.save')}</button>
            <button onClick={() => setAddingValue(false)} className="text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => setAddingValue(true)} className="text-xs text-prima-orange hover:underline inline-flex items-center gap-0.5">
            <Plus className="w-3 h-3" /> {t('productDetail.addValue')}
          </button>
        )}
      </div>
    </div>
  )
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent'
const cellInp = 'w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

function Field({ label, value, sub }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-medium text-prima-dark">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Btn({ children, onClick, color }) {
  const colors = {
    red:   'bg-red-50 text-red-700 hover:bg-red-100',
    gray:  'bg-gray-100 text-gray-600 hover:bg-gray-200',
    blue:  'bg-blue-50 text-blue-700 hover:bg-blue-100',
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
  }
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colors[color]}`}>
      {children}
    </button>
  )
}

function StockActionModal({ product, mode, onClose, onSaved }) {
  const { t } = useTranslation()
  const [quantity, setQuantity] = useState('')
  const [variantId, setVariantId] = useState('')
  const [salonId, setSalonId] = useState('')
  const [salons, setSalons] = useState([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'sell') getSalons().then((d) => setSalons(Array.isArray(d) ? d : []))
  }, [mode])

  const hasVariants = (product.variants ?? []).length > 0

  const submit = async (e) => {
    e.preventDefault()
    const qty = Number(quantity)
    if (!qty || qty < 1) return
    setSaving(true)
    setError('')
    try {
      const payload = { quantity: qty, product_variant_id: variantId || undefined }
      if (mode === 'add') {
        await addProductStock(product.id, payload)
      } else {
        await directSellProduct(product.id, { ...payload, salon_id: salonId || undefined, note: note || undefined })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message ?? t('productDetail.stockActionFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-prima-dark mb-4">
          {mode === 'add' ? t('productDetail.addStockTitle') : t('productDetail.directSellTitle')}
        </h2>
        <form onSubmit={submit} className="space-y-4">
          {hasVariants && (
            <div>
              <label className="block text-xs font-medium text-prima-dark mb-1">{t('productDetail.variantOptional')}</label>
              <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className={inp}>
                <option value="">{t('productDetail.wholeProduct')}</option>
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {(v.attribute_values ?? []).map((av) => av.value).join(' / ')} — {t('products.stockLabel', { count: v.stock })}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-prima-dark mb-1">{t('productDetail.quantity')}</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inp} autoFocus />
          </div>

          {mode === 'sell' && (
            <>
              <div>
                <label className="block text-xs font-medium text-prima-dark mb-1">{`${t('cashier.filters.salon')} (${t('common.optional')})`}</label>
                <select value={salonId} onChange={(e) => setSalonId(e.target.value)} className={inp}>
                  <option value="">{t('productDetail.noSalon')}</option>
                  {salons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-prima-dark mb-1">{`${t('cashier.form.note')} (${t('common.optional')})`}</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} className={inp} placeholder={t('cashier.form.notePlaceholder')} />
              </div>
            </>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function offerStatusOf(offerPrice, startsAt, endsAt) {
  if (offerPrice === null || offerPrice === undefined || !startsAt || !endsAt) return 'none'
  const now = new Date()
  if (now < new Date(startsAt)) return 'scheduled'
  if (now > new Date(endsAt)) return 'expired'
  return 'active'
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function OfferStatusPill({ status }) {
  const { t } = useTranslation()
  const map = {
    active:    { label: t('productDetail.offerActive'),    cls: 'bg-green-100 text-green-700' },
    scheduled: { label: t('productDetail.offerScheduled'), cls: 'bg-blue-50 text-blue-600' },
    expired:   { label: t('productDetail.offerExpired'),   cls: 'bg-gray-100 text-gray-500' },
    none:      { label: t('productDetail.offerNone'),      cls: 'bg-gray-100 text-gray-400' },
  }
  const { label, cls } = map[status]
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${cls}`}>{label}</span>
}

function OfferForm({ initial, onSave }) {
  const { t } = useTranslation()
  const [price, setPrice] = useState(initial.offer_price ?? '')
  const [clientPrice, setClientPrice] = useState(initial.offer_client_price ?? '')
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(initial.offer_starts_at))
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(initial.offer_ends_at))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const status = offerStatusOf(initial.offer_price, initial.offer_starts_at, initial.offer_ends_at)

  const save = async () => {
    setSaving(true); setError('')
    try {
      await onSave({ offer_price: Number(price), offer_client_price: Number(clientPrice), offer_starts_at: startsAt, offer_ends_at: endsAt })
    } catch (err) {
      setError(err.response?.data?.message ?? t('productDetail.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const clear = async () => {
    setSaving(true); setError('')
    try {
      await onSave({ offer_price: null, offer_client_price: null, offer_starts_at: null, offer_ends_at: null })
      setPrice(''); setClientPrice(''); setStartsAt(''); setEndsAt('')
    } catch (err) {
      setError(err.response?.data?.message ?? t('productDetail.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <OfferStatusPill status={status} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-prima-dark mb-1">{t('productDetail.offerSalonPrice')}</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-prima-dark mb-1">{t('productDetail.offerClientPrice')}</label>
          <input type="number" step="0.01" value={clientPrice} onChange={(e) => setClientPrice(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-prima-dark mb-1">{t('productDetail.offerStartsAt')}</label>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-prima-dark mb-1">{t('productDetail.offerEndsAt')}</label>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inp} />
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors">
          {saving ? t('common.saving') : t('common.save')}
        </button>
        {status !== 'none' && (
          <button type="button" onClick={clear} disabled={saving} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            {t('productDetail.clearOffer')}
          </button>
        )}
      </div>
    </div>
  )
}

function OfferCard({ title, hint, initial, onSave }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
        <span className="font-semibold text-prima-dark">{title}</span>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
        <OfferForm initial={initial} onSave={onSave} />
      </div>
    </div>
  )
}

function TiersForm({ initialRows, onSave, readOnlyPreview }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState(initialRows.map((r) => ({ min_quantity: r.min_quantity, price: r.price ?? '', client_price: r.client_price ?? '' })))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateRow = (i, patch) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const addRow = () => setRows((rs) => [...rs, { min_quantity: '', price: '', client_price: '' }])
  const removeRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i))

  const save = async () => {
    setSaving(true); setError('')
    try {
      const payload = rows.map((r) => ({
        min_quantity: Number(r.min_quantity),
        price: r.price === '' ? null : Number(r.price),
        client_price: r.client_price === '' ? null : Number(r.client_price),
      }))
      await onSave(payload)
    } catch (err) {
      setError(err.response?.data?.message ?? t('productDetail.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {readOnlyPreview && readOnlyPreview.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-3 text-xs text-gray-500">
          <p className="font-medium text-gray-600 mb-1">{t('productDetail.inheritingTiers')}</p>
          {readOnlyPreview.map((r, i) => (
            <p key={i}>{t('productDetail.tierSummary', { qty: r.min_quantity, price: r.price, clientPrice: r.client_price })}</p>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('productDetail.noTiersYet')}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-end gap-2 flex-wrap">
              <div>
                <label className="block text-[11px] text-gray-400 mb-0.5">{t('productDetail.minQuantity')}</label>
                <input type="number" min="1" value={r.min_quantity} onChange={(e) => updateRow(i, { min_quantity: e.target.value })} className={`${cellInp} w-20`} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-0.5">{t('productDetail.offerSalonPrice')}</label>
                <input type="number" step="0.01" value={r.price} onChange={(e) => updateRow(i, { price: e.target.value })} className={`${cellInp} w-24`} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-0.5">{t('productDetail.offerClientPrice')}</label>
                <input type="number" step="0.01" value={r.client_price} onChange={(e) => updateRow(i, { client_price: e.target.value })} className={`${cellInp} w-24`} />
              </div>
              <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-500 transition-colors mb-1.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={addRow} className="text-xs text-prima-orange hover:underline inline-flex items-center gap-1">
        <Plus className="w-3 h-3" /> {t('productDetail.addTier')}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors">
          {saving ? t('common.saving') : t('productDetail.saveTiers')}
        </button>
      </div>
    </div>
  )
}

function PriceTiersCard({ title, hint, initialTiers, onSave }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
        <span className="font-semibold text-prima-dark">{title}</span>
      </div>
      <div className="p-5 sm:p-6 space-y-3">
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
        <TiersForm initialRows={initialTiers} onSave={onSave} />
      </div>
    </div>
  )
}

function VariantPricingModal({ product, variant, onClose, onSaved }) {
  const { t } = useTranslation()
  const label = (variant.attribute_values ?? []).map((av) => av.value).join(' / ')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-prima-dark mb-1">{t('productDetail.variantPricingTitle')}</h2>
        <p className="text-xs text-gray-400 mb-4">{label}</p>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-prima-dark mb-3">{t('productDetail.specialOffer')}</h3>
            <OfferForm
              initial={variant}
              onSave={(data) => setVariantOffer(product.id, variant.id, data).then((updated) => { onSaved(updated); return updated })}
            />
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-prima-dark mb-3">{t('productDetail.priceBreaks')}</h3>
            <TiersForm
              initialRows={variant.has_own_price_tiers ? variant.price_tiers : []}
              readOnlyPreview={variant.has_own_price_tiers ? null : variant.price_tiers}
              onSave={(tiers) => saveVariantPriceTiers(product.id, variant.id, tiers).then((updated) => { onSaved(updated); return updated })}
            />
          </div>
        </div>

        <div className="pt-5 mt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
