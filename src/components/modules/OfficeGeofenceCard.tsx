'use client';

import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { api } from '../../lib/api';
import { saveOfficeGeofenceConfig } from '../../lib/geoService';

type Fence = {
  officeName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  enabled: boolean;
};

export function OfficeGeofenceCard() {
  const [fence, setFence] = useState<Fence | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getGeofence().then((data) => {
      setFence(data);
      saveOfficeGeofenceConfig({
        officeName: data.officeName,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        radiusMeters: Number(data.radiusMeters) || 500,
        enabled: data.enabled !== false,
      });
    }).catch((error: Error) => setMessage(error.message || 'Office area could not be loaded.'));
  }, []);

  const save = async () => {
    if (!fence) return;
    setSaving(true);
    setMessage('');
    try {
      const saved = await api.saveGeofence({
        latitude: Number(fence.latitude),
        longitude: Number(fence.longitude),
        radiusMeters: Number(fence.radiusMeters),
        enabled: fence.enabled,
      });
      setFence(saved);
      saveOfficeGeofenceConfig({
        officeName: saved.officeName,
        latitude: Number(saved.latitude),
        longitude: Number(saved.longitude),
        radiusMeters: Number(saved.radiusMeters) || 500,
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
      <p className="text-xs text-slate-500">Employees can punch only inside this circle, and only when their selfie matches the profile photo.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs font-bold text-slate-700">
          Latitude
          <input
            type="number"
            step="0.000001"
            value={fence.latitude}
            onChange={(event) => setFence({ ...fence, latitude: Number(event.target.value) })}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
          />
        </label>
        <label className="text-xs font-bold text-slate-700">
          Longitude
          <input
            type="number"
            step="0.000001"
            value={fence.longitude}
            onChange={(event) => setFence({ ...fence, longitude: Number(event.target.value) })}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
          />
        </label>
        <div className="text-xs font-bold text-slate-700">
          Radius
          <div className="mt-1 flex gap-2">
            {[50, 100, 150].map((meters) => (
              <button
                key={meters}
                type="button"
                onClick={() => setFence({ ...fence, radiusMeters: meters })}
                className={`h-10 flex-1 rounded-xl border font-bold cursor-pointer ${
                  Number(fence.radiusMeters) === meters
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {meters} m
              </button>
            ))}
          </div>
        </div>
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
