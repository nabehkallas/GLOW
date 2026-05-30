import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Layout from '../../components/Layout'

export default function Media() {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editCaption, setEditCaption] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const fileRef = useRef()

  const load = () =>
    api.get('/salon/media').then(({ data }) => {
      setItems(data.data ?? data)
      setLoading(false)
    })

  useEffect(() => { load() }, [])

  const handleFiles = async (files) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post('/salon/media', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      await load()
    } catch (e) {
      alert(e.response?.data?.message ?? t('media.uploadFailed'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const destroy = async (id) => {
    if (!confirm(t('media.deleteConfirm'))) return
    await api.delete(`/salon/media/${id}`)
    setItems((prev) => prev.filter((m) => m.id !== id))
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditCaption(item.caption ?? '')
  }

  const saveCaption = async (id) => {
    await api.patch(`/salon/media/${id}`, { caption: editCaption })
    setItems((prev) => prev.map((m) => m.id === id ? { ...m, caption: editCaption } : m))
    setEditingId(null)
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-prima-dark">{t('media.title')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t('media.subtitle')}</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg shadow-sm font-medium transition-colors disabled:opacity-50"
          >
            {uploading ? t('media.uploading') : t('media.upload')}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 hover:border-prima-orange hover:text-prima-orange transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <svg className="w-8 h-8 mx-auto mb-2 opacity-60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium">{t('media.dropHint')}</p>
          <p className="text-xs mt-1 opacity-70">{t('media.fileTypes')}</p>
        </div>

        {/* Grid */}
        {loading ? (
          <p className="text-center text-gray-400 py-12">{t('common.loading')}</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-12">{t('media.empty')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                {/* Thumbnail */}
                <div
                  className="aspect-square bg-gray-100 overflow-hidden cursor-zoom-in"
                  onClick={() => setLightbox(item)}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.caption ?? ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-prima-dark">
                      <svg className="w-10 h-10 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Type badge */}
                {item.type === 'video' && (
                  <span className="absolute top-2 start-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    {t('media.video')}
                  </span>
                )}

                {/* Action buttons (hover) */}
                <div className="absolute top-2 end-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(item)}
                    className="bg-white/90 hover:bg-white rounded-lg p-1.5 shadow-sm transition-colors"
                    title={t('common.edit')}
                  >
                    <svg className="w-3.5 h-3.5 text-prima-dark" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 112.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => destroy(item.id)}
                    className="bg-white/90 hover:bg-red-50 rounded-lg p-1.5 shadow-sm transition-colors"
                    title={t('common.delete')}
                  >
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
                    </svg>
                  </button>
                </div>

                {/* Caption */}
                <div className="p-2">
                  {editingId === item.id ? (
                    <div className="flex gap-1">
                      <input
                        autoFocus
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveCaption(item.id); if (e.key === 'Escape') setEditingId(null) }}
                        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        placeholder={t('media.captionPlaceholder')}
                      />
                      <button onClick={() => saveCaption(item.id)} className="text-xs px-2 py-1 bg-prima-orange text-white rounded transition-colors">✓</button>
                    </div>
                  ) : (
                    <p
                      className="text-xs text-gray-500 truncate cursor-pointer hover:text-prima-dark transition-colors"
                      onClick={() => startEdit(item)}
                    >
                      {item.caption || <span className="italic opacity-50">{t('media.noCaption')}</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 end-4 text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {lightbox.type === 'image' ? (
            <img
              src={lightbox.url}
              alt={lightbox.caption ?? ''}
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={lightbox.url}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {lightbox.caption && (
            <p className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm px-4">
              {lightbox.caption}
            </p>
          )}
        </div>
      )}
    </Layout>
  )
}
