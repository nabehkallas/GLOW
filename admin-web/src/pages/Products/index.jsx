import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function Products() {
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const load = () => api.get('admin/products').then(({ data }) => setProducts(data.data ?? data))
  useEffect(() => { load() }, [])

  const openNew = () => {
    reset({ name: '', description: '', price: '', stock: '', category: '' })
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (p) => {
    reset({ name: p.name, description: p.description ?? '', price: p.price, stock: p.stock, category: p.category ?? '' })
    setEditing(p)
    setShowForm(true)
  }

  const onSubmit = async (data) => {
    if (editing) await api.put(`admin/products/${editing.id}`, data)
    else await api.post('admin/products', data)
    setShowForm(false)
    load()
  }

  const destroy = async (id) => {
    if (!confirm('Delete this product?')) return
    await api.delete(`admin/products/${id}`)
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
          <h1 className="text-2xl font-bold text-prima-dark">Products</h1>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg shadow-sm font-medium transition-colors"
          >
            + Add Product
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-prima-dark mb-4">{editing ? 'Edit Product' : 'New Product'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <Field label="Name">
                <input {...register('name', { required: true })} className={inp} />
              </Field>
              <Field label="Category">
                <input {...register('category')} className={inp} placeholder="e.g. Hair Care, Skin, Tools" />
              </Field>
              <Field label="Price ($)">
                <input {...register('price', { required: true })} type="number" step="0.01" className={inp} />
              </Field>
              <Field label="Stock">
                <input {...register('stock', { required: true })} type="number" className={inp} />
              </Field>
              <div className="col-span-2">
                <Field label="Description">
                  <textarea {...register('description')} className={inp} rows={2} />
                </Field>
              </div>
              <div className="col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors"
                >
                  Save
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-semibold text-prima-dark">{p.name}</p>
                    {p.category && (
                      <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                        {p.category}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-prima-orange">${p.price}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Stock: {p.stock}</p>
                {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => openEdit(p)} className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">Edit</button>
                  <button onClick={() => destroy(p.id)} className="text-xs px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors">Delete</button>
                  <label className="text-xs px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer transition-colors">
                    {uploadingId === p.id ? 'Uploading…' : 'Upload Image'}
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

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent'
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-prima-dark mb-1">{label}</label>
      {children}
    </div>
  )
}
