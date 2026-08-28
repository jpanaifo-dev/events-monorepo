import { useEffect, useMemo } from "react"
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

type Coordinates = { latitude: number; longitude: number }

const markerIcon = L.divIcon({
  className: "",
  html: '<div style="width:20px;height:20px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 1px 5px rgba(0,0,0,.45)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function MapClickHandler({ onSelect }: { onSelect: (coordinates: Coordinates) => void }) {
  useMapEvents({ click: (event) => onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng }) })
  return null
}

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMapEvents({})
  useEffect(() => { map.setView(position, position[0] === -3.7491 && position[1] === -73.2538 ? 13 : 15) }, [map, position])
  return null
}

export function LocationPickerMap({ latitude, longitude, onSelect }: { latitude?: number; longitude?: number; onSelect: (coordinates: Coordinates) => void }) {
  const position = useMemo<[number, number]>(() => [latitude ?? -3.7491, longitude ?? -73.2538], [latitude, longitude])
  return <MapContainer center={position} zoom={latitude !== undefined && longitude !== undefined ? 15 : 5} className="h-64 w-full rounded-md border" scrollWheelZoom><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapClickHandler onSelect={onSelect} /><RecenterMap position={position} />{latitude !== undefined && longitude !== undefined && <Marker position={position} icon={markerIcon} draggable eventHandlers={{ dragend: (event) => { const point = event.target.getLatLng(); onSelect({ latitude: point.lat, longitude: point.lng }) } }} />}</MapContainer>
}
