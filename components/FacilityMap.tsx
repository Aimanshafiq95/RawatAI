"use client";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Facility } from "@/lib/routing";

// Fix default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const primaryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const altIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const capacityColor: Record<string, string> = {
  NORMAL:   "#10B981",
  MODERATE: "#F59E0B",
  BUSY:     "#F59E0B",
  CRITICAL: "#E02424",
  UNKNOWN:  "#9CA3AF",
};

interface Props {
  facilities: Facility[];
  center?: [number, number];
  userLocation?: [number, number];
}

export default function FacilityMap({ facilities, center, userLocation }: Props) {
  const mapCenter = center ?? (facilities[0] ? [facilities[0].lat, facilities[0].lon] : [3.139, 101.6869]) as [number, number];

  return (
    <MapContainer center={mapCenter} zoom={12} style={{ width: "100%", height: "100%" }} scrollWheelZoom={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {userLocation && (
        <Circle center={userLocation} radius={500} pathOptions={{ color: "#1A56DB", fillColor: "#1A56DB", fillOpacity: 0.2 }} />
      )}
      {facilities.map((f, i) => (
        <Marker key={f.id} position={[f.lat, f.lon]} icon={i === 0 ? primaryIcon : altIcon}>
          <Popup>
            <div style={{ fontFamily: "Montserrat, sans-serif", minWidth: 180 }}>
              <strong style={{ fontSize: "0.85rem" }}>{f.name}</strong><br />
              <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{f.district}, {f.state}</span><br />
              {f.util_nonicu !== null && (
                <span style={{ fontSize: "0.75rem", color: capacityColor[f.capacity_status] }}>
                  Capacity: {Math.round(f.util_nonicu)}% ({f.capacity_status})
                </span>
              )}
              {f.phone && <><br /><a href={`tel:${f.phone}`} style={{ fontSize: "0.75rem" }}>📞 {f.phone}</a></>}
              <br />
              <span style={{ fontSize: "0.75rem" }}>📏 {f.distance_km} km away</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
