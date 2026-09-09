export function localizedCategory(p, lang) {
  return (lang === 'ar' ? p.category_ar : p.category_en) || p.category_en || p.category_ar;
}
