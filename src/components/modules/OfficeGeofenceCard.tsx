'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { api } from '../../lib/api';
import { getCurrentGPSLocation, saveOfficeGeofenceConfig } from '../../lib/geoService';

type Fence = {
  officeName?: string;
  latitude: number | string | null;
  longitude: number | string | null;
  radiusMeters: number;
  enabled: boolean;
};

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => void;
  panTo: (center: [number, number]) => void;
  on: (event: string, handler: (event: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
};

function OfficeAreaMap({
  latitude,
  longitude,
  radiusMeters,
  onPick,
}: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onPick: (latitude: number, longitude: number) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<{ setLatLng: (point: [number, number]) => void } | null>(null);
  const circleRef = useRef<{ setLatLng: (point: [number, number]) => void; setRadius: (meters: number) => void } | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  const pointRef = useRef({ latitude, longitude, radiusMeters });
  pointRef.current = { latitude, longitude, radiusMeters };

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      const leaflet = (window as unknown as { L?: any }).L;
      if (!leaflet || !holder.current || mapRef.current || cancelled) return;
      const here = pointRef.current;
      const map = leaflet.map(holder.current).setView([here.latitude, here.longitude], 16);
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      const pin = leaflet.divIcon({
        className: '',
        html: '<div style="width:22px;height:22px;border-radius:999px;background:#059669;border:3px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,.45)"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      markerRef.current = leaflet.marker([here.latitude, here.longitude], { icon: pin }).addTo(map);
      circleRef.current = leaflet.circle([here.latitude, here.longitude], {
        radius: here.radiusMeters,
        color: '#059669',
        fillColor: '#34d399',
        fillOpacity: 0.28,
      }).addTo(map);
      map.on('click', (event: { latlng: { lat: number; lng: number } }) => {
        pickRef.current(event.latlng.lat, event.latlng.lng);
      });
      mapRef.current = map;
    };
    if ((window as unknown as { L?: unknown }).L) {
      draw();
    } else {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const existing = document.getElementById('leaflet-js');
      if (existing) existing.addEventListener('load', draw);
      else {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = draw;
        document.body.appendChild(script);
      }
    }
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const point: [number, number] = [latitude, longitude];
    markerRef.current?.setLatLng(point);
    circleRef.current?.setLatLng(point);
    circleRef.current?.setRadius(radiusMeters);
    mapRef.current.panTo(point);
  }, [latitude, longitude, radiusMeters]);

  return <div ref={holder} className="h-72 w-full rounded-2xl border border-slate-200 overflow-hidden z-0" />;
}

export function OfficeGeofenceCard() {
  const [fence, setFence] = useState<Fence | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const placeHere = (data: Fence) => {
      const rawLat = (data as any)?.latitude;
      const rawLng = (data as any)?.longitude;
      const hasCoords = rawLat !== null && rawLat !== undefined && rawLat !== '' && rawLng !== null && rawLng !== undefined && rawLng !== '';
      const latitude = hasCoords ? Number(rawLat) : NaN;
      const longitude = hasCoords ? Number(rawLng) : NaN;
      const suratPlaceholder = Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude - 21.1702) < 0.01 && Math.abs(longitude - 72.8311) < 0.01;
      const missing = !Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0);
      if (!suratPlaceholder && !missing) {
        setFence({
          ...data,
          latitude,
          longitude,
          radiusMeters: Number(data.radiusMeters) || 100,
          enabled: data.enabled !== false,
        });
        saveOfficeGeofenceConfig({
          officeName: data.officeName || '',
          latitude,
          longitude,
          radiusMeters: Number(data.radiusMeters) || 100,
          enabled: data.enabled !== false,
        });
        return;
      }
      setMessage('Finding your current location...');
      getCurrentGPSLocation().then(async (coords) => {
        if (cancelled) return;
        const entered = Number(data.radiusMeters);
        const radiusMeters = Number.isFinite(entered) && entered >= 10 && entered <= 5000 ? entered : 100;
        const saved = await api.saveGeofence({
          latitude: coords.latitude,
          longitude: coords.longitude,
          radiusMeters,
          enabled: data.enabled !== false,
        });
        if (cancelled) return;
        setFence(saved);
        saveOfficeGeofenceConfig({
          officeName: saved.officeName,
          latitude: Number(saved.latitude),
          longitude: Number(saved.longitude),
          radiusMeters: Number(saved.radiusMeters) || radiusMeters,
          enabled: saved.enabled !== false,
        });
        setMessage('Office area is set to your current location.');
      }).catch((error: Error) => {
        if (cancelled) return;
        setFence({
          ...data,
          latitude: Number.isFinite(latitude) ? latitude : 23.0225,
          longitude: Number.isFinite(longitude) ? longitude : 72.5714,
          radiusMeters: Number(data.radiusMeters) || 100,
          enabled: data.enabled !== false,
        });
        setMessage(error.message || 'Allow location so the map can use where you are now.');
      });
    };
    api.getGeofence().then((data) => {
      if (!cancelled) placeHere(data);
    }).catch((error: Error) => {
      if (!cancelled) setMessage(error.message || 'Office area could not be loaded.');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    if (!fence) return;
    const lat = Number(fence.latitude);
    const lng = Number(fence.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setMessage('Please enter valid latitude and longitude coordinates.');
      return;
    }
    const radiusMeters = Math.round(Number(fence.radiusMeters));
    if (!Number.isFinite(radiusMeters) || radiusMeters < 10 || radiusMeters > 5000) {
      setMessage('Radius must be between 10 and 5000 meters.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const saved = await api.saveGeofence({
        latitude: lat,
        longitude: lng,
        radiusMeters,
        enabled: fence.enabled !== false,
      });
      setFence(saved);
      saveOfficeGeofenceConfig({
        officeName: saved.officeName,
        latitude: Number(saved.latitude),
        longitude: Number(saved.longitude),
        radiusMeters: Number(saved.radiusMeters) || 100,
        enabled: saved.enabled !== false,
      });
      setMessage('Office area saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Office area could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (!fence) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">{message || 'Loading office area...'}</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-emerald-600" />
        <h3 className="text-sm font-black text-slate-900">Office geofence</h3>
      </div>
      <p className="text-xs text-slate-500">Click the map to place the office. The green circle is the only area where employees can punch.</p>
      <OfficeAreaMap
        latitude={Number(fence.latitude)}
        longitude={Number(fence.longitude)}
        radiusMeters={Number(fence.radiusMeters) || 500}
        onPick={(latitude, longitude) => setFence({ ...fence, latitude, longitude })}
      />
      <button
        type="button"
        onClick={() => {
          setMessage('Finding your current location...');
          getCurrentGPSLocation().then(async (coords) => {
            const next = { ...fence, latitude: coords.latitude, longitude: coords.longitude };
            setFence(next);
            const saved = await api.saveGeofence({
              latitude: coords.latitude,
              longitude: coords.longitude,
              radiusMeters: Number(fence.radiusMeters) || 100,
              enabled: fence.enabled,
            });
            setFence(saved);
            saveOfficeGeofenceConfig({
              officeName: saved.officeName,
              latitude: Number(saved.latitude),
              longitude: Number(saved.longitude),
              radiusMeters: Number(saved.radiusMeters) || 100,
              enabled: saved.enabled !== false,
            });
            setMessage('Office area is set to your current location.');
          }).catch((error: Error) => setMessage(error.message || 'Current location was not available.'));
        }}
        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
      >
        Use my current location
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs font-bold text-slate-700">
          Latitude
          <input
            type="number"
            step="0.000001"
            value={fence.latitude ?? ''}
            onChange={(event) => {
              const val = event.target.value;
              setFence({ ...fence, latitude: val === '' ? '' : Number(val) });
            }}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
          />
        </label>
        <label className="text-xs font-bold text-slate-700">
          Longitude
          <input
            type="number"
            step="0.000001"
            value={fence.longitude ?? ''}
            onChange={(event) => {
              const val = event.target.value;
              setFence({ ...fence, longitude: val === '' ? '' : Number(val) });
            }}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
          />
        </label>
        <label className="text-xs font-bold text-slate-700">
          Radius (meters)
          <input
            type="number"
            min={10}
            max={5000}
            step={1}
            value={fence.radiusMeters}
            onChange={(event) => {
              const next = event.target.value === '' ? 0 : Number(event.target.value);
              setFence({ ...fence, radiusMeters: next });
            }}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
        <input
          type="checkbox"
          checked={fence.enabled}
          onChange={(event) => setFence({ ...fence, enabled: event.target.checked })}
        />
        Geofence is required for employee punch
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save office area'}
        </button>
        {message && <span className="text-xs font-semibold text-slate-600">{message}</span>}
      </div>
    </div>
  );
}
