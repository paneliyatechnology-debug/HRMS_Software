'use client';

import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { useCompanyLive } from '../../lib/useCompanyLive';
import { validateImageFile } from '../../lib/imageUtils';

const LIMITED = ['EMPLOYEE', 'HR', 'MANAGER'];

export function ProfilePhotoCard() {
  const { user, updateUserProfile } = useAuth();
  const { showToast } = useSocket();
  const role = String(user?.role || '').toUpperCase();
  const limited = LIMITED.includes(role);
  const [access, setAccess] = useState<{ canUpload: boolean; locked: boolean; requestStatus: string | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const load = async () => {
    try {
      setAccess(await api.getPhotoAccess());
    } catch {
      setAccess(null);
    }
  };

  useEffect(() => {
    if (user?.id && limited) void load();
  }, [user?.id, user?.avatarUrl, limited]);
  useCompanyLive(['employees'], () => {
    if (limited) void load();
  });

  if (!limited) return null;

  const pending = access?.requestStatus === 'Pending';
  const approved = access?.requestStatus === 'Approved';
  const rejected = access?.requestStatus === 'Rejected';
  const canUpload = access ? access.canUpload || approved : !user.avatarUrl;
  const status = !user.avatarUrl
    ? 'Upload one clear face photo. After it is saved, you cannot change it yourself.'
    : pending
      ? 'Your change request is waiting. Admin or HR must approve it before you can upload again.'
      : canUpload
        ? 'Approval is done. Upload the new photo now. It will lock again after this upload.'
        : rejected
          ? 'The last request was rejected. You can send a new request.'
          : 'This photo is locked. Ask an admin or HR if you need to change it.';

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-black text-slate-900">Change profile photo</p>
          <p className="text-xs text-slate-600">{status}</p>
          <div className="flex flex-wrap gap-2">
            {canUpload ? (
              <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading...' : user.avatarUrl ? 'Upload approved photo' : 'Upload photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    const validation = validateImageFile(file);
                    if (!validation.valid) {
                      showToast({ type: 'error', title: 'Invalid image', message: validation.error || 'Choose a photo.' });
                      return;
                    }
                    setUploading(true);
                    try {
                      const { assertFaceInPhoto } = await import('../../lib/faceMatch');
                      const faceDescriptor = await assertFaceInPhoto(file);
                      const saved = await api.uploadProfilePhoto(file, faceDescriptor);
                      if (!saved.avatarUrl) throw new Error('Profile photo was not saved.');
                      updateUserProfile({ avatarUrl: saved.avatarUrl, photoChangeAllowed: false });
                      setAccess({ canUpload: false, locked: true, requestStatus: 'Used' });
                      showToast({ type: 'success', title: 'Photo saved', message: 'This photo is now locked. Ask an admin to change it again.' });
                    } catch (err: any) {
                      showToast({ type: 'error', title: 'Upload failed', message: err.message || 'Photo could not be saved.' });
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
            ) : (
              <button
                type="button"
                disabled={requesting || pending}
                onClick={async () => {
                  setRequesting(true);
                  try {
                    const result = await api.requestPhotoChange();
                    showToast({ type: 'success', title: 'Request sent', message: result.message });
                    await load();
                  } catch (err: any) {
                    showToast({ type: 'error', title: 'Request failed', message: err.message || 'Could not ask the admin.' });
                  } finally {
                    setRequesting(false);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer disabled:opacity-60"
              >
                {pending ? 'Waiting for admin approval' : 'Ask admin to change photo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
