import api from './axios'

export const getProducts = (params) =>
  api.get('admin/products', { params }).then((r) => r.data)

export const getProduct = (id) =>
  api.get(`admin/products/${id}`).then((r) => r.data.data ?? r.data)

export const createProduct = (data) =>
  api.post('admin/products', data).then((r) => r.data.data ?? r.data)

export const updateProduct = (id, data) =>
  api.put(`admin/products/${id}`, data).then((r) => r.data.data ?? r.data)

export const deleteProduct = (id) =>
  api.delete(`admin/products/${id}`)

export const createAttribute = (productId, data) =>
  api.post(`admin/products/${productId}/attributes`, data).then((r) => r.data.data ?? r.data)

export const updateAttribute = (productId, attrId, data) =>
  api.patch(`admin/products/${productId}/attributes/${attrId}`, data).then((r) => r.data.data ?? r.data)

export const deleteAttribute = (productId, attrId) =>
  api.delete(`admin/products/${productId}/attributes/${attrId}`)

export const addAttributeValue = (productId, attrId, data) =>
  api.post(`admin/products/${productId}/attributes/${attrId}/values`, data).then((r) => r.data.data ?? r.data)

export const updateAttributeValue = (productId, valueId, data) =>
  api.patch(`admin/products/${productId}/attribute-values/${valueId}`, data).then((r) => r.data.data ?? r.data)

export const deleteAttributeValue = (productId, valueId) =>
  api.delete(`admin/products/${productId}/attribute-values/${valueId}`)

export const generateVariants = (productId) =>
  api.post(`admin/products/${productId}/variants/generate`).then((r) => r.data.data ?? r.data)

export const bulkUpdateVariants = (productId, variants) =>
  api.put(`admin/products/${productId}/variants`, { variants }).then((r) => r.data.data ?? r.data)

export const deleteVariant = (productId, variantId) =>
  api.delete(`admin/products/${productId}/variants/${variantId}`)

export const addProductImage = (productId, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`admin/products/${productId}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data.data ?? r.data)
}

export const deleteProductImage = (productId, imageId) =>
  api.delete(`admin/products/${productId}/images/${imageId}`)

export const addProductStock = (productId, data) =>
  api.patch(`admin/products/${productId}/add-stock`, data).then((r) => r.data.data ?? r.data)

export const directSellProduct = (productId, data) =>
  api.post(`admin/products/${productId}/direct-sell`, data).then((r) => r.data.data ?? r.data)

// Send all 4 fields to set the offer, or all null to clear it.
export const setProductOffer = (productId, data) =>
  api.put(`admin/products/${productId}/offer`, data).then((r) => r.data.data ?? r.data)

export const setVariantOffer = (productId, variantId, data) =>
  api.put(`admin/products/${productId}/variants/${variantId}/offer`, data).then((r) => r.data.data ?? r.data)

export const saveProductPriceTiers = (productId, tiers) =>
  api.put(`admin/products/${productId}/price-tiers`, { tiers }).then((r) => r.data.data ?? r.data)

export const saveVariantPriceTiers = (productId, variantId, tiers) =>
  api.put(`admin/products/${productId}/variants/${variantId}/price-tiers`, { tiers }).then((r) => r.data.data ?? r.data)
