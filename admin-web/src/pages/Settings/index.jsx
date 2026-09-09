import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Globe, Bell, RotateCcw } from 'lucide-react'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/auth'
import { switchLanguage } from '../../i18n'
import { isPushSupported, isSubscribedToPush, subscribeToPush, unsubscribeFromPush } from '../../services/pushNotifications'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../../api/adminUsers'
import api from '../../api/axios'

const PERMISSIONS = [
  { key: 'salons',         labelKey: 'nav.salons' },
  { key: 'products',       labelKey: 'nav.products' },
  { key: 'orders',         labelKey: 'nav.orders' },
  { key: 'client_orders',  labelKey: 'nav.clientOrders' },
  { key: 'analytics',      labelKey: 'nav.analytics' },
  { key: 'cashier',        labelKey: 'nav.cashier' },
  { key: 'appointments',   labelKey: 'settings.permissionAppointments' },
]

const EMPTY_FORM = { name: '', email: '', password: '', permissions: [] }

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user: me } = useAuthStore()
  const [admins, setAdmins] = useState(null)
  const [modal, setModal] = useState(null) // { mode: 'create' | 'edit', target? }
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const load = () => getAdminUsers().then((data) => setAdmins(Array.isArray(data) ? data : data.data ?? []))

  useEffect(() => { if (me?.is_super_admin) load() }, [me?.is_super_admin])

  const [returnWindowDays, setReturnWindowDays] = useState('')
  const [returnWindowSaving, setReturnWindowSaving] = useState(false)
  const [returnWindowSaved, setReturnWindowSaved] = useState(false)

  useEffect(() => {
    if (!me?.is_super_admin) return
    api.get('admin/settings').then(({ data }) => setReturnWindowDays(String(data.return_window_days)))
  }, [me?.is_super_admin])

  const saveReturnWindow = async (e) => {
    e.preventDefault()
    setReturnWindowSaving(true)
    setReturnWindowSaved(false)
    try {
      const { data } = await api.patch('admin/settings', { return_window_days: Number(returnWindowDays) })
      setReturnWindowDays(String(data.return_window_days))
      setReturnWindowSaved(true)
      setTimeout(() => setReturnWindowSaved(false), 2000)
    } finally {
      setReturnWindowSaving(false)
    }
  }

  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushSaving, setPushSaving] = useState(false)
  const [pushError, setPushError] = useState('')

  useEffect(() => { isSubscribedToPush().then(setPushEnabled) }, [])

  const togglePush = async () => {
    setPushSaving(true)
    setPushError('')
    try {
      if (pushEnabled) {
        await unsubscribeFromPush()
        setPushEnabled(false)
      } else {
        await subscribeToPush()
        setPushEnabled(true)
      }
    } catch (err) {
      setPushError(err.message || t('settings.saveFailed'))
    } finally {
      setPushSaving(false)
    }
  }

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setModal({ mode: 'create' }) }
  const openEdit = (admin) => {
    setForm({ name: admin.name, email: admin.email, password: '', permissions: admin.permissions ?? [] })
    setError('')
    setModal({ mode: 'edit', target: admin })
  }

  const togglePermission = (key) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter((p) => p !== key) : [...f.permissions, key],
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (modal.mode === 'create') {
        const created = await createAdminUser(form)
        setAdmins((prev) => [...prev, created])
      } else {
        const payload = { name: form.name, permissions: form.permissions }
        if (form.password) payload.password = form.password
        const updated = await updateAdminUser(modal.target.id, payload)
        setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      }
      setModal(null)
    } catch (err) {
      setError(err.response?.data?.message ?? t('settings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (admin) => {
    if (!window.confirm(t('settings.deleteConfirm', { name: admin.name }))) return
    setDeletingId(admin.id)
    try {
      await deleteAdminUser(admin.id)
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-prima-dark">{t('settings.title')}</h1>

        {/* Language */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <p className="font-semibold text-prima-dark mb-3">{t('settings.language')}</p>
          <div className="flex gap-3">
            {['ar', 'en'].map((lang) => (
              <button
                key={lang}
                onClick={() => switchLanguage(lang)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  i18n.language === lang
                    ? 'border-prima-orange bg-orange-50 text-prima-orange'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Globe className="w-4 h-4" /> {lang === 'ar' ? t('lang.arabic') : t('lang.english')}
              </button>
            ))}
          </div>
        </div>

        {/* Push Notifications */}
        {isPushSupported() && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-prima-orange" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-prima-dark">{t('settings.pushNotificationsTitle')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('settings.pushNotificationsDescription')}</p>
                {pushError && <p className="text-red-600 text-sm mt-2">{pushError}</p>}
              </div>
              <button
                onClick={togglePush}
                disabled={pushSaving}
                role="switch"
                aria-checked={pushEnabled}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
                  pushEnabled ? 'bg-prima-orange' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    pushEnabled ? 'translate-x-[22px] rtl:-translate-x-[22px]' : 'translate-x-0.5 rtl:-translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {me?.is_super_admin && (
        <>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-prima-orange" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-prima-dark">{t('settings.returnWindowTitle')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('settings.returnWindowDescription')}</p>
              <form onSubmit={saveReturnWindow} className="flex items-center gap-3 mt-3">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={returnWindowDays}
                  onChange={(e) => setReturnWindowDays(e.target.value)}
                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  dir="ltr"
                />
                <span className="text-sm text-gray-500">{t('settings.days')}</span>
                <button
                  type="submit"
                  disabled={returnWindowSaving}
                  className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors"
                >
                  {returnWindowSaving ? t('common.saving') : t('common.save')}
                </button>
                {returnWindowSaved && <span className="text-green-600 text-sm">{t('settings.saved')}</span>}
              </form>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-prima-dark">{t('settings.adminUsersTitle')}</h2>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg shadow-sm font-medium transition-colors"
          >
            {t('settings.addAdmin')}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {!admins ? (
            <p className="text-gray-400 text-sm p-6">{t('common.loading')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-prima-dark text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-start">{t('settings.table.name')}</th>
                    <th className="px-4 py-3 text-start">{t('settings.table.email')}</th>
                    <th className="px-4 py-3 text-start">{t('settings.table.permissions')}</th>
                    <th className="px-4 py-3 text-start">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-t border-gray-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-prima-dark">{admin.name}</td>
                      <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                      <td className="px-4 py-3">
                        {admin.is_super_admin ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-prima-dark text-white">
                            {t('settings.superAdmin')}
                          </span>
                        ) : (admin.permissions ?? []).length === 0 ? (
                          <span className="text-xs text-gray-400">{t('settings.noPermissions')}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {admin.permissions.map((key) => (
                              <span key={key} className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                                {t(PERMISSIONS.find((p) => p.key === key)?.labelKey ?? key)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!admin.is_super_admin && (
                          <div className="flex items-center gap-3">
                            <button onClick={() => openEdit(admin)} className="text-gray-400 hover:text-prima-dark" title={t('common.edit')}>
                              <Pencil className="w-4 h-4" />
                            </button>
                            {admin.id !== me?.id && (
                              <button
                                onClick={() => handleDelete(admin)}
                                disabled={deletingId === admin.id}
                                className="text-gray-300 hover:text-red-500 disabled:opacity-40"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-prima-dark mb-4">
              {modal.mode === 'create' ? t('settings.addAdmin') : t('settings.editAdmin')}
            </h2>
            <form onSubmit={submit} className="space-y-4">
              <Field label={t('settings.form.name')}>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className={inp}
                />
              </Field>
              {modal.mode === 'create' && (
                <Field label={t('settings.form.email')}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    dir="ltr"
                    className={inp}
                  />
                </Field>
              )}
              <Field label={modal.mode === 'create' ? t('settings.form.password') : t('settings.form.newPassword')}>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={modal.mode === 'create'}
                  placeholder={modal.mode === 'edit' ? t('settings.form.passwordUnchanged') : ''}
                  className={inp}
                />
              </Field>
              <div>
                <label className="block text-xs font-medium text-prima-dark mb-2">{t('settings.form.permissions')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSIONS.map(({ key, labelKey }) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(key)}
                        onChange={() => togglePermission(key)}
                        className="rounded border-gray-300 text-prima-orange focus:ring-orange-400"
                      />
                      {t(labelKey)}
                    </label>
                  ))}
                </div>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors"
                >
                  {saving ? t('common.saving') : t('common.save')}
                </button>
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
