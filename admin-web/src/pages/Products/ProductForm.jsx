import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

export default function ProductForm({ defaultValues, onSubmit, onCancel, hasVariants = false }) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
      <Field label={t('products.name')}>
        <input {...register('name', { required: true })} className={inp} />
      </Field>
      <Field label={t('products.categoryEn')}>
        <input {...register('category_en')} className={inp} placeholder={t('products.categoryPlaceholder')} dir="ltr" />
      </Field>
      <Field label={t('products.categoryAr')}>
        <input {...register('category_ar')} className={inp} placeholder={t('products.categoryPlaceholderAr')} dir="rtl" />
      </Field>
      <Field label={t('products.salonPrice')} hint={t('products.salonPriceHint')}>
        <input {...register('price', { required: true })} type="number" step="0.01" className={inp} />
      </Field>
      <Field label={t('products.clientPrice')} hint={t('products.clientPriceHint')}>
        <input {...register('client_price', { required: true })} type="number" step="0.01" className={inp} />
      </Field>
      <Field label={t('products.stock')} hint={hasVariants ? t('products.stockManagedByVariants') : null}>
        <input {...register('stock', { required: true })} type="number" className={inp} disabled={hasVariants} />
      </Field>
      <div className="col-span-2">
        <Field label={t('products.description')}>
          <textarea {...register('description')} className={inp} rows={2} />
        </Field>
      </div>
      <div className="col-span-2 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-prima-orange hover:bg-[#c93d15] text-white text-sm rounded-lg disabled:opacity-50 font-medium shadow-sm transition-colors"
        >
          {t('common.save')}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">{t('common.cancel')}</button>
      </div>
    </form>
  )
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400'
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-prima-dark mb-1">
        {label}
        {hint && <span className="font-normal text-gray-400"> — {hint}</span>}
      </label>
      {children}
    </div>
  )
}
