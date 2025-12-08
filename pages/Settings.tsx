import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { StorageService } from '../services/storage';
import { Button } from '../components/ui/Button';
import { Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    notificationMethod: 'SMS'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(StorageService.getSettings());
  }, []);

  const handleSave = () => {
    StorageService.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">Configuration des notifications et intégrations.</p>
      </div>

      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Configuration Twilio</h2>
        
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
                <input 
                    type="password"
                    placeholder="AC................"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none font-mono text-sm placeholder-gray-400"
                    value={settings.twilioAccountSid}
                    onChange={e => setSettings({...settings, twilioAccountSid: e.target.value})}
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                <input 
                    type="password"
                    placeholder="................................"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none font-mono text-sm placeholder-gray-400"
                    value={settings.twilioAuthToken}
                    onChange={e => setSettings({...settings, twilioAuthToken: e.target.value})}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'expédition Twilio</label>
                <input 
                    type="text"
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none placeholder-gray-400"
                    value={settings.twilioPhoneNumber}
                    onChange={e => setSettings({...settings, twilioPhoneNumber: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Doit être au format E.164 (ex: +33612345678).</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de notification</label>
                <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                        <input 
                            type="radio" 
                            className="form-radio text-slate-900" 
                            name="method"
                            checked={settings.notificationMethod === 'SMS'}
                            onChange={() => setSettings({...settings, notificationMethod: 'SMS'})}
                        />
                        <span className="ml-2 text-gray-900">SMS</span>
                    </label>
                    <label className="inline-flex items-center">
                        <input 
                            type="radio" 
                            className="form-radio text-slate-900" 
                            name="method"
                            checked={settings.notificationMethod === 'WHATSAPP'}
                            onChange={() => setSettings({...settings, notificationMethod: 'WHATSAPP'})}
                        />
                        <span className="ml-2 text-gray-900">WhatsApp</span>
                    </label>
                </div>
            </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
            <span className={`text-sm text-green-600 transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
                Paramètres enregistrés avec succès.
            </span>
            <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
            </Button>
        </div>
      </div>
    </div>
  );
};