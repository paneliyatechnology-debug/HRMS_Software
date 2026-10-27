'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Plus,
  Check,
  Copy,
  Terminal,
  Activity,
  Wifi,
  WifiOff,
  Server,
  Fingerprint,
  ScanFace,
  CreditCard,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Building,
  Info,
  CheckCircle2,
  AlertCircle,
  Code2,
} from 'lucide-react';
import {
  BiometricDevice,
  getBiometricDevices,
  saveBiometricDevice,
  deleteBiometricDevice,
  generateDeviceApiKey,
  getCloudWebhookUrl,
  processBiometricPunch,
  generateNodeJsAgentScript,
  generatePythonAgentScript,
} from '../../lib/biometricService';
import { Employee } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';

interface BiometricHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onRefreshAttendance: () => void;
  currentCompanyId?: string;
  currentCompanyName?: string;
}

export const BiometricHubModal: React.FC<BiometricHubModalProps> = ({
  isOpen,
  onClose,
  employees,
  onRefreshAttendance,
  currentCompanyId = 'comp-paneliya',
  currentCompanyName = 'Paneliya Technology Inc.',
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'devices' | 'add' | 'adms' | 'agent' | 'test'>('devices');
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BiometricDevice | null>(null);

  // Form states for Add Device
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState<BiometricDevice['brand']>('eSSL');
  const [formModel, setFormModel] = useState('eSSL MB20 Face & Fingerprint');
  const [formSerial, setFormSerial] = useState('');
  const [formIp, setFormIp] = useState('192.168.1.201');
  const [formPort, setFormPort] = useState(4370);
  const [formLocation, setFormLocation] = useState('Main Office Entrance');
  const [formConnType, setFormConnType] = useState<'cloud_push_adms' | 'local_agent_bridge'>('cloud_push_adms');

  // Simulator states
  const [simEmpCode, setSimEmpCode] = useState(employees[0]?.employeeCode || 'EMP-1');
  const [simMode, setSimMode] = useState<'FINGERPRINT' | 'FACE' | 'RFID_CARD'>('FINGERPRINT');
  const [simResult, setSimResult] = useState<{ success: boolean; message: string; punchType?: string } | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadDevices = () => {
    const list = getBiometricDevices(currentCompanyId);
    setDevices(list);
    if (!selectedDevice && list.length > 0) {
      setSelectedDevice(list[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDevices();
      setSimResult(null);
    }
  }, [isOpen, currentCompanyId]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSerial.trim()) {
      alert('Device Name and Serial Number are required.');
      return;
    }

    const newDevice: BiometricDevice = {
      id: `bio-${Date.now()}`,
      companyId: currentCompanyId,
      companyName: currentCompanyName,
      deviceName: formName.trim(),
      brand: formBrand,
      model: formModel.trim() || `${formBrand} Terminal`,
      serialNumber: formSerial.trim().toUpperCase(),
      ipAddress: formIp.trim() || '192.168.1.201',
      port: Number(formPort) || 4370,
      connectionType: formConnType,
      branchLocation: formLocation.trim() || 'Headquarters',
      secretApiKey: generateDeviceApiKey(currentCompanyId, formName),
      status: 'online',
      lastSyncAt: 'Just now',
      totalPunches: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    saveBiometricDevice(newDevice);
    loadDevices();
    setSelectedDevice(newDevice);
    setActiveTab('devices');

    // Reset
    setFormName('');
    setFormSerial('');
  };

  const handleDeleteDevice = (id: string, name: string) => {
    if (confirm(`Remove biometric device "${name}" from company configuration?`)) {
      deleteBiometricDevice(id);
      loadDevices();
    }
  };

  const handleRunTestPunch = async () => {
    setSimLoading(true);
    setSimResult(null);

    setTimeout(() => {
      const res = processBiometricPunch({
        companyId: currentCompanyId,
        deviceId: selectedDevice?.id,
        deviceApiKey: selectedDevice?.secretApiKey,
        employeeCode: simEmpCode,
        verificationMode: simMode,
      });

      setSimResult(res);
      setSimLoading(false);
      if (res.success) {
        onRefreshAttendance();
        loadDevices();
      }
    }, 600);
  };

  const webhookUrl = getCloudWebhookUrl();
  const activeDevice = selectedDevice || devices[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Physical Biometric Hardware Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-black uppercase">
                  Multi-Company Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Connect eSSL, ZKTeco, Realtime, Mantra & Matrix devices for{' '}
                <strong className="text-slate-700">{currentCompanyName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 pt-3 pb-2 border-b border-slate-100 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'devices'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Connected Devices ({devices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'add'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Device</span>
          </button>

          <button
            onClick={() => setActiveTab('adms')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'adms'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cloud Push / ADMS Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('agent')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'agent'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-500" />
            <span>Local Agent Bridge</span>
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'test'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5 text-amber-500" />
            <span>Live Punch Simulator</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-3 text-xs">
          {/* TAB 1: DEVICES LIST */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Registered Biometric Machines
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Punches from these machines will automatically mark attendance for {currentCompanyName}.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Device</span>
                </button>
              </div>

              {devices.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No Biometric Devices Connected Yet</p>
                  <p className="text-slate-500 text-[11px] max-w-sm mx-auto mt-1">
                    Connect your office eSSL, ZKTeco, or Realtime machine to start syncing live fingerprint and face punches.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                  >
                    + Add Your First Device
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {devices.map((dev) => (
                    <div
                      key={dev.id}
                      onClick={() => setSelectedDevice(dev)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        selectedDevice?.id === dev.id
                          ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs">
                            {dev.brand[0]}
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs">{dev.deviceName}</h5>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {dev.brand} • {dev.model}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${
                            dev.status === 'online'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              dev.status === 'online' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                            }`}
                          />
                          {dev.status}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                        <div>
                          <span className="text-slate-400 block uppercase font-bold">Serial Number</span>
                          <span className="font-bold text-slate-800">{dev.serialNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold">Mode</span>
                          <span className="font-bold text-indigo-700">
                            {dev.connectionType === 'cloud_push_adms' ? 'Cloud ADMS' : 'LAN Bridge'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold">Location</span>
                          <span className="text-slate-700 truncate block">{dev.branchLocation}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold">Total Punches</span>
                          <span className="text-emerald-700 font-extrabold">{dev.totalPunches} punches</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Activity className="w-3 h-3 text-emerald-500" />
                          <span>Last Sync: {dev.lastSyncAt || 'Never'}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDevice(dev);
                              setActiveTab('adms');
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px]"
                          >
                            Setup Key
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDevice(dev.id, dev.deviceName);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete device"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD NEW DEVICE */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateDevice} className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm">Register Physical Biometric Hardware</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enter your biometric machine details to generate its dedicated Company API Key.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Device Friendly Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Reception Gate eSSL MB20"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manufacturer Brand *</label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  >
                    <option value="eSSL">eSSL Security</option>
                    <option value="ZKTeco">ZKTeco Biometrics</option>
                    <option value="Realtime">Realtime Biometrics</option>
                    <option value="Mantra">Mantra Softech</option>
                    <option value="Biomax">Biomax Security</option>
                    <option value="Hikvision">Hikvision Face Terminal</option>
                    <option value="Matrix">Matrix COSEC</option>
                    <option value="Other">Other Compatible Device</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Model Name / Number</label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="e.g. MB20, uFace800, T52"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hardware Serial Number *</label>
                  <input
                    type="text"
                    required
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    placeholder="e.g. ZK89012345 (found on device sticker)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Connection Protocol</label>
                  <select
                    value={formConnType}
                    onChange={(e) => setFormConnType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold"
                  >
                    <option value="cloud_push_adms">Cloud Push / ADMS (Device pushes directly to Internet)</option>
                    <option value="local_agent_bridge">Local LAN Gateway (Agent PC reads port 4370)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Office / Branch Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Surat HQ • Main Entrance"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Local IP Address</label>
                  <input
                    type="text"
                    value={formIp}
                    onChange={(e) => setFormIp(e.target.value)}
                    placeholder="e.g. 192.168.1.201"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Communication Port</label>
                  <input
                    type="number"
                    value={formPort}
                    onChange={(e) => setFormPort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('devices')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md shadow-slate-900/20 cursor-pointer"
                >
                  Save & Generate Device API Key
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CLOUD PUSH / ADMS WALKTHROUGH */}
          {activeTab === 'adms' && activeDevice && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-indigo-950 text-xs">
                    Direct Cloud Push / ADMS Configuration for: {activeDevice.deviceName}
                  </h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    Modern devices push attendance directly to your HRMS over Wi-Fi/Ethernet. No computer needed to be kept ON in the office!
                  </p>
                </div>
              </div>

              {/* Endpoint & Key Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900 text-white font-mono space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Cloud Webhook Push URL</span>
                    <button
                      onClick={() => handleCopy(webhookUrl, 'url')}
                      className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'url' ? 'Copied!' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <p className="text-xs break-all text-emerald-300 font-bold">{webhookUrl}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 text-white font-mono space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Secret Device API Key</span>
                    <button
                      onClick={() => handleCopy(activeDevice.secretApiKey, 'key')}
                      className="text-amber-400 hover:text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'key' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'key' ? 'Copied!' : 'Copy Key'}</span>
                    </button>
                  </div>
                  <p className="text-xs break-all text-amber-300 font-bold">{activeDevice.secretApiKey}</p>
                </div>
              </div>

              {/* Step by step machine menu guide */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                  Physical Machine Screen Par Kya Karna Hai? (4 Steps)
                </h5>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <p>
                      Biometric machine ka <strong>M/OK</strong> button 3 seconds tak dabakar <strong>Main Menu</strong> kholein.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <p>
                      <strong>Comm. (Communication)</strong> ya <strong>Network Settings</strong> par jayein aur{' '}
                      <strong>Cloud Server / ADMS / Web Server</strong> select karein.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div className="space-y-1">
                      <p>Waha ye settings enter karein:</p>
                      <ul className="list-disc pl-5 text-[11px] font-mono text-slate-800 space-y-0.5">
                        <li><strong>Enable Cloud Server / ADMS:</strong> ON</li>
                        <li><strong>Server Address / Domain:</strong> {window?.location?.hostname || '192.168.1.110'}</li>
                        <li><strong>Server Port:</strong> 4000 (ya 80/443 for HTTPS)</li>
                        <li><strong>Device Push URL:</strong> /api/biometric/push</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      4
                    </span>
                    <p>
                      Settings <strong>Save</strong> karke machine restart karein. Machine screen par top bar me ek chhota sa{' '}
                      <strong className="text-emerald-600">Cloud / Globe icon</strong> aayega jo confirm karega ki machine HRMS se live connect ho gayi hai!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOCAL AGENT BRIDGE (NODE / PYTHON) */}
          {activeTab === 'agent' && activeDevice && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs">
                  Local LAN Gateway Agent (For Non-Cloud Biometric Devices)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Agar aapki biometric machine me ADMS nahi hai aur wo sirf office Wi-Fi / LAN par chalti hai (Port 4370), to office ke kisi bhi computer par ye chhota script run karein.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs">Node.js Sync Agent Script</span>
                  <button
                    onClick={() => handleCopy(generateNodeJsAgentScript(activeDevice), 'node')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'node' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'node' ? 'Copied to Clipboard!' : 'Copy Node.js Script'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-64 border border-slate-800">
                  <pre>{generateNodeJsAgentScript(activeDevice)}</pre>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs">Python Sync Agent Script (pyzk)</span>
                  <button
                    onClick={() => handleCopy(generatePythonAgentScript(activeDevice), 'py')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'py' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'py' ? 'Copied to Clipboard!' : 'Copy Python Script'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-56 border border-slate-800">
                  <pre>{generatePythonAgentScript(activeDevice)}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE PUNCH SIMULATOR */}
          {activeTab === 'test' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-amber-600" />
                  Live Biometric Hardware Punch Simulator
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Test your setup without touching the physical device. Simulate a live fingerprint or facial recognition punch for any employee!
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Employee (or Enter Code)</label>
                  <select
                    value={simEmpCode}
                    onChange={(e) => setSimEmpCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.employeeCode || emp.id}>
                        {emp.employeeCode} • {emp.firstName} {emp.lastName} ({emp.departmentName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Verification Sensor Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSimMode('FINGERPRINT')}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        simMode === 'FINGERPRINT'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>Fingerprint</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimMode('FACE')}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        simMode === 'FACE'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ScanFace className="w-3.5 h-3.5" />
                      <span>Face Scan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimMode('RFID_CARD')}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        simMode === 'RFID_CARD'
                          ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>RFID Card</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Simulate Through Device</label>
                  <select
                    value={selectedDevice?.id || ''}
                    onChange={(e) => {
                      const found = devices.find((d) => d.id === e.target.value);
                      if (found) setSelectedDevice(found);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.deviceName} ({d.brand} {d.model}) - {d.branchLocation}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleRunTestPunch}
                  disabled={simLoading || !simEmpCode}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {simLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Fingerprint className="w-4 h-4" />
                  )}
                  <span>{simLoading ? 'Transmitting Punch Packet...' : 'Simulate Hardware Punch'}</span>
                </button>

                {simResult && (
                  <div
                    className={`p-3.5 rounded-xl border animate-in fade-in ${
                      simResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {simResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-extrabold text-xs block">
                          {simResult.success ? `✅ Punch Recorded (${simResult.punchType})` : '❌ Punch Failed'}
                        </span>
                        <p className="text-[11px] mt-0.5">{simResult.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Building className="w-3.5 h-3.5" />
            <span>Active Tenant: <strong>{currentCompanyName}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
