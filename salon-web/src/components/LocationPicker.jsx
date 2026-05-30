import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconPng from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIconPng,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const SYRIA_CENTER = [34.8021, 38.9968]

function MapController({ lat, lng }) {
  const map = useMap()
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    if (lat && lng) map.flyTo([+lat, +lng], 13, { duration: 1 })
  }, [lat, lng])
  return null
}

function ClickHandler({ onSelect }) {
  useMapEvents({
    click: (e) => onSelect(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)),
  })
  return null
}

export default function LocationPicker({ lat, lng, onChange }) {
  const { t } = useTranslation()
  const hasLocation = lat && lng

  const handleGPS = () => {
    if (!navigator.geolocation) { alert(t('location.noSupport')); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange(+pos.coords.latitude.toFixed(6), +pos.coords.longitude.toFixed(6)),
      () => alert(t('location.gpsError'))
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-gray-700">{t('location.label')}</label>
        <button
          type="button"
          onClick={handleGPS}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {t('location.useGPS')}
        </button>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-300" style={{ height: '280px' }}>
        <MapContainer
          center={hasLocation ? [+lat, +lng] : SYRIA_CENTER}
          zoom={hasLocation ? 13 : 6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController lat={lat} lng={lng} />
          <ClickHandler onSelect={onChange} />
          {hasLocation && <Marker position={[+lat, +lng]} />}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-400">{t('location.mapHint')}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('location.latitude')}</label>
          <input
            type="number" step="any" value={lat ?? ''}
            onChange={(e) => onChange(e.target.value, lng)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder={t('location.latPlaceholder')}
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('location.longitude')}</label>
          <input
            type="number" step="any" value={lng ?? ''}
            onChange={(e) => onChange(lat, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder={t('location.lngPlaceholder')}
            dir="ltr"
          />
        </div>
      </div>
    </div>
  )
}
