"use client";
import { useState, useEffect, useRef } from "react";
import { useInventory } from "../Providers";

export default function CsrWorkflow() {
  const { reservations } = useInventory();
  const deployed = reservations.filter((res: any) => res.status === "deployed");
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [L, setL] = useState<any>(null);
  const [geocodingStatus, setGeocodingStatus] = useState("");

  // Load Leaflet dynamically (client-side only)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const leaflet = await import("leaflet");
      // Inject leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (mounted) setL(leaflet.default || leaflet);
    })();
    return () => { mounted = false; };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current).setView([-1.2921, 36.8219], 7); // default: Nairobi
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [L]);

  // Geocode deployed locations and place markers
  useEffect(() => {
    if (!L || !mapRef.current) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (deployed.length === 0) return;

    const geocode = async () => {
      setGeocodingStatus("Locating deployments...");
      const bounds: any[] = [];

      for (const item of deployed) {
        if (!item.location) continue;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.location)}&limit=1`);
          const results = await res.json();
          if (results && results[0]) {
            const lat = parseFloat(results[0].lat);
            const lng = parseFloat(results[0].lon);
            bounds.push([lat, lng]);

            const cg = item.commercial_grade || "?";
            const pg = item.physical_grade || "?";
            const popupHtml = `
              <div style="font-family: Arial; font-size: 12px; min-width: 220px;">
                <div style="font-weight: bold; font-size: 14px; color: #1e40af; margin-bottom: 6px;">${item.description}</div>
                <div style="margin-bottom: 4px;"><strong>Customer:</strong> ${item.customer || "—"}</div>
                <div style="margin-bottom: 4px;"><strong>Location:</strong> ${item.location}</div>
                <div style="margin-bottom: 4px;"><strong>Deployed:</strong> ${item.reserved_at ? new Date(item.reserved_at).toLocaleDateString() : "—"}</div>
                <div style="margin-bottom: 4px;"><strong>Quantity:</strong> ${item.quantity || 1}</div>
                <div style="margin-bottom: 4px;"><strong>Grades:</strong> N${cg} / P${pg}</div>
              </div>
            `;

            const marker = L.marker([lat, lng]).addTo(mapRef.current).bindPopup(popupHtml);
            markersRef.current.push(marker);
          } else {
            console.warn("Geocode failed for:", item.location);
          }
        } catch (err) {
          console.error("Geocode error:", err);
        }
        // Nominatim requires 1 request/sec
        await new Promise(r => setTimeout(r, 1100));
      }

      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
      setGeocodingStatus(`📍 ${bounds.length} of ${deployed.length} deployments plotted`);
    };

    geocode();
  }, [L, deployed.length]);

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">CSR Workflow — Deployed Items Map</h2>
          <p className="text-sm text-gray-500 mt-1">Hover/click any pin to see deployment details.</p>
        </div>

        {/* LIVE MAP */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-blue-600">Live Deployment Map</h3>
            <span className="text-xs text-gray-500">{geocodingStatus}</span>
          </div>
          <div ref={mapContainerRef} style={{ height: "500px", width: "100%" }} />
        </div>

        {/* DEPLOYED LIST */}
        {deployed.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 overflow-auto">
            <h3 className="text-lg font-bold text-blue-600 mb-4">Deployed Items ({deployed.length})</h3>
            <table className="w-full text-left text-sm">
              <thead className="text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Location</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3">Grades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deployed.map((d: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3">{d.description}</td>
                    <td className="p-3 text-blue-700 font-semibold">{d.customer || "—"}</td>
                    <td className="p-3">{d.location || "—"}</td>
                    <td className="p-3 text-center font-bold">{d.quantity || 1}</td>
                    <td className="p-3 text-xs">
                      N{d.commercial_grade || "?"} / P{d.physical_grade || "?"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}