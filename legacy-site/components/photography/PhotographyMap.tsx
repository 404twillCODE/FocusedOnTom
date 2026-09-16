"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

type Pin = {
  id: string;
  url: string;
  lat: number;
  lng: number;
  alt: string;
  eventTitle: string;
  href: string;
};

// Leaflet's default icons reference assets via webpack-style imports that
// don't resolve in Next. Build a small inline SVG marker instead.
const pinIcon = L.divIcon({
  className: "focusedontom-pin",
  html: `<div style="
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: rgba(108, 215, 255, 0.9);
    border: 2px solid #0b0f16;
    box-shadow: 0 0 0 2px rgba(108, 215, 255, 0.35);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function PhotographyMap({ pins }: { pins: Pin[] }) {
  const center: [number, number] = pins.length
    ? [pins[0].lat, pins[0].lng]
    : [20, 0];

  return (
    <MapContainer
      center={center}
      zoom={pins.length ? 4 : 2}
      style={{ height: "min(70vh, 620px)", width: "100%" }}
      scrollWheelZoom
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {pins.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon}>
          <Popup>
            <div style={{ minWidth: 160 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.alt}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 6,
                  display: "block",
                }}
              />
              <div style={{ marginTop: 6, fontSize: 12 }}>
                <b>{p.eventTitle}</b>
                <br />
                <a href={p.href} style={{ color: "#6cd7ff" }}>
                  View event →
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
