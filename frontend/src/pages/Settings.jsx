import { useState, useEffect } from 'react';
import { Save, Clock, MessageSquare, Key, Store } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { toast } from '../components/Toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data } = await dashboardAPI.getSettings();
      setSettings(data);
    } catch (error) {
      toast('Failed to load settings', 'error');
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await dashboardAPI.updateSettings(settings);
      toast('Settings saved! ✅');
    } catch (error) {
      toast('Failed to save settings', 'error');
    }
    setSaving(false);
  }

  function updateField(field, value) {
    setSettings(prev => ({ ...prev, [field]: value }));
  }

  function updateTiming(field, value) {
    setSettings(prev => ({
      ...prev,
      shopTimings: { ...prev.shopTimings, [field]: parseInt(value) || 0 },
    }));
  }

  if (loading || !settings) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Settings <span className="text-gray-400 text-lg font-normal">/ सेटिंग्स</span>
        </h1>
        <button
          id="save-settings-btn"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Saving...' : 'Save / सेव करें'}
        </button>
      </div>

      {/* Shop Info */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Store size={20} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-800">Shop Info / दुकान की जानकारी</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Shop Name <span className="text-gray-400">(दुकान का नाम)</span>
            </label>
            <input
              type="text"
              value={settings.shopName}
              onChange={(e) => updateField('shopName', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Owner Name <span className="text-gray-400">(मालिक का नाम)</span>
            </label>
            <input
              type="text"
              value={settings.ownerName}
              onChange={(e) => updateField('ownerName', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Location <span className="text-gray-400">(जगह)</span>
            </label>
            <input
              type="text"
              value={settings.shopLocation}
              onChange={(e) => updateField('shopLocation', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Owner Phone <span className="text-gray-400">(फ़ोन नंबर — for alerts)</span>
            </label>
            <input
              type="text"
              value={settings.ownerPhone || ''}
              onChange={(e) => updateField('ownerPhone', e.target.value)}
              placeholder="919876543210"
              className="input-field"
            />
          </div>
        </div>
      </section>

      {/* Shop Timings */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-800">Shop Timings / दुकान का समय</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Bot will auto-reply "dukaan band hai" outside these hours (IST)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Open Hour</label>
            <input
              type="number"
              value={settings.shopTimings?.openHour ?? 7}
              onChange={(e) => updateTiming('openHour', e.target.value)}
              className="input-field"
              min="0" max="23"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Open Minute</label>
            <input
              type="number"
              value={settings.shopTimings?.openMinute ?? 0}
              onChange={(e) => updateTiming('openMinute', e.target.value)}
              className="input-field"
              min="0" max="59"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Close Hour</label>
            <input
              type="number"
              value={settings.shopTimings?.closeHour ?? 21}
              onChange={(e) => updateTiming('closeHour', e.target.value)}
              className="input-field"
              min="0" max="23"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Close Minute</label>
            <input
              type="number"
              value={settings.shopTimings?.closeMinute ?? 0}
              onChange={(e) => updateTiming('closeMinute', e.target.value)}
              className="input-field"
              min="0" max="59"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3 bg-primary-50 px-3 py-2 rounded-lg">
          🕐 Currently: {String(settings.shopTimings?.openHour ?? 7).padStart(2, '0')}:
          {String(settings.shopTimings?.openMinute ?? 0).padStart(2, '0')} — 
          {String(settings.shopTimings?.closeHour ?? 21).padStart(2, '0')}:
          {String(settings.shopTimings?.closeMinute ?? 0).padStart(2, '0')} IST
        </p>
      </section>

      {/* Messages */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={20} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-800">Messages / संदेश</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Welcome Message <span className="text-gray-400">(ग्राहक को पहला संदेश)</span>
            </label>
            <textarea
              value={settings.welcomeMessage}
              onChange={(e) => updateField('welcomeMessage', e.target.value)}
              className="input-field min-h-[100px] resize-y"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Closed Message (Timing) <span className="text-gray-400">(समय के बाहर)</span>
            </label>
            <textarea
              value={settings.closedMessage}
              onChange={(e) => updateField('closedMessage', e.target.value)}
              className="input-field min-h-[80px] resize-y"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-1">
              Placeholders: {'{shopName}'}, {'{shopLocation}'}, {'{openHour}'}, {'{closeHour}'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Closed Message (Manual) <span className="text-gray-400">(हाथ से बंद करने पर)</span>
            </label>
            <textarea
              value={settings.manualClosedMessage}
              onChange={(e) => updateField('manualClosedMessage', e.target.value)}
              className="input-field min-h-[80px] resize-y"
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* API Credentials */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Key size={20} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-800">API Credentials / API कुंजी</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          ⚠️ These are sensitive. Change only if you know what you're doing.
        </p>
        <div className="space-y-4">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">UPI Payments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Owner UPI ID</label>
                <input
                  type="text"
                  value={settings.ownerUPIId || ''}
                  onChange={(e) => updateField('ownerUPIId', e.target.value)}
                  className="input-field text-sm font-mono"
                  placeholder="name@okicici"
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Meta WhatsApp API</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Access Token</label>
                <input
                  type="password"
                  value={settings.metaAccessToken || ''}
                  onChange={(e) => updateField('metaAccessToken', e.target.value)}
                  className="input-field text-sm font-mono"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={settings.metaPhoneNumberId || ''}
                    onChange={(e) => updateField('metaPhoneNumberId', e.target.value)}
                    className="input-field text-sm font-mono"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Webhook Verify Token</label>
                  <input
                    type="text"
                    value={settings.metaWebhookVerifyToken || ''}
                    onChange={(e) => updateField('metaWebhookVerifyToken', e.target.value)}
                    className="input-field text-sm font-mono"
                    placeholder="my_verify_token"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Save button (bottom) */}
      <div className="sticky bottom-4 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-3.5 text-base shadow-xl"
        >
          {saving ? 'Saving...' : 'Save All Settings / सब सेव करें ✅'}
        </button>
      </div>
    </div>
  );
}
