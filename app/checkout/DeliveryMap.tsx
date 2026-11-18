"use client";

import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  onLocationSelect: (
    address: string,
    latitude: number,
    longitude: number
  ) => void;
};

const bungoma: [number, number] = [-0.5635, 34.5606];

const pin = L.divIcon({
  className: "delivery-pin",
  html: "📍",
  iconSize: [30, 35],
  iconAnchor: [15, 30],
});

export default function DeliveryMap({ onLocationSelect }: Props) {
  const [position, setPosition] = useState(bungoma);
  const [message, setMessage] = useState(
    "Tap the map to choose your delivery point."
  );

  async function selectPoint(lat: number, lng: number) {
    setPosition([lat, lng]);

    const fallback = `Map location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );

      if (!response.ok) throw new Error("Address lookup failed");

      const data = await response.json();
      const address = data.display_name || fallback;

      onLocationSelect(address, lat, lng);
      setMessage(`Selected: ${address}`);
    } catch {
      onLocationSelect(fallback, lat, lng);
      setMessage("Location selected using map coordinates.");
    }
  }

  function ClickHandler() {
    useMapEvents({
      click(event) {
        void selectPoint(event.latlng.lat, event.latlng.lng);
      },
    });

    return null;
  }

  function locateMe() {
    navigator.geolocation?.getCurrentPosition(
      (result) =>
        void selectPoint(
          result.coords.latitude,
          result.coords.longitude
        ),
      () => setMessage("Location permission denied. Tap the map instead.")
    );
  }

  return (
    <section className="delivery-map-section">
      <h3>📍 Choose Your Delivery Location</h3>
      <p>Tap the map to select the delivery point around Bungoma.</p>

      <button
        type="button"
        className="delivery-location-button"
        onClick={locateMe}
      >
        Use My Location
      </button>

      <div className="delivery-map-frame">
        <MapContainer
          center={bungoma}
          zoom={13}
          className="delivery-leaflet-map"
          scrollWheelZoom
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler />
          <Marker position={position} icon={pin} />
        </MapContainer>
      </div>

      <p className="delivery-map-status">{message}</p>
      <small>
        Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
      </small>
    </section>
  );
}
