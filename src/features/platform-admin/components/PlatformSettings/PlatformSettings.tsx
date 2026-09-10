// src/features/platform-admin/components/PlatformSettings/PlatformSettings.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Badge } from '@/components/ui/Badge';

interface Setting {
  id: string;
  key: string;
  value: any;
  description: string;
  category: string;
}

export function PlatformSettings() {
  const [settings, setSettings] = useState<Setting[]>([
    { id: '1', key: 'point_valuation_usd', value: 0.10, description: 'USD value of 1 point', category: 'points' },
    { id: '2', key: 'monthly_employee_cap', value: 1000, description: 'Maximum points per employee per month', category: 'points' },
    { id: '3', key: 'enable_leaderboards', value: true, description: 'Show leaderboards to employees', category: 'features' },
    { id: '4', key: 'enable_challenges', value: true, description: 'Enable challenge system', category: 'features' },
    { id: '5', key: 'enable_social_feed', value: true, description: 'Enable social feed', category: 'features' },
    { id: '6', key: 'enable_rewards', value: true, description: 'Enable rewards system', category: 'features' },
    { id: '7', key: 'enable_meetup_api', value: false, description: 'Enable Meetup API integration', category: 'integrations' },
    { id: '8', key: 'enable_google_places', value: false, description: 'Enable Google Places integration', category: 'integrations' },
    { id: '9', key: 'require_verification', value: true, description: 'Require verification for activities', category: 'verification' },
    { id: '10', key: 'allow_gps_verification', value: true, description: 'Allow GPS verification', category: 'verification' },
    { id: '11', key: 'allow_qr_verification', value: true, description: 'Allow QR code verification', category: 'verification' },
    { id: '12', key: 'allow_host_approval', value: true, description: 'Allow host approval', category: 'verification' },
    { id: '13', key: 'notification_reminder_days', value: 1, description: 'Days before event to send reminders', category: 'notifications' },
    { id: '14', key: 'default_activity_duration', value: 60, description: 'Default activity duration in minutes', category: 'defaults' },
    { id: '15', key: 'default_points_per_activity', value: 50, description: 'Default points per activity', category: 'defaults' },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateSetting = (id: string, value: any) => {
    setSettings(settings.map(s => s.id === id ? { ...s, value } : s));
  };

  const handleSave = () => {
    setIsSaving(true);
    setMessage(null);
    // Save to localStorage for now
    localStorage.setItem('platformSettings', JSON.stringify(settings));
    setTimeout(() => {
      setIsSaving(false);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(null), 3000);
    }, 500);
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
    points: { label: 'Points & Rewards', icon: 'Star', color: 'text-yellow-600' },
    features: { label: 'Features', icon: 'ToggleLeft', color: 'text-blue-600' },
    integrations: { label: 'Integrations', icon: 'Plug', color: 'text-purple-600' },
    verification: { label: 'Verification', icon: 'ShieldCheck', color: 'text-emerald-600' },
    notifications: { label: 'Notifications', icon: 'Bell', color: 'text-red-600' },
    defaults: { label: 'Defaults', icon: 'Settings', color: 'text-slate-600' },
  };

  const renderSettingInput = (setting: Setting) => {
    const value = setting.value;

    if (typeof value === 'boolean') {
      return (
        <Switch
          checked={value}
          onCheckedChange={(checked) => updateSetting(setting.id, checked)}
        />
      );
    } else if (typeof value === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => updateSetting(setting.id, parseFloat(e.target.value) || 0)}
          className="w-32"
        />
      );
    } else {
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => updateSetting(setting.id, e.target.value)}
          className="w-48"
        />
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Platform Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure global platform settings and defaults
          </p>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <Badge variant="success">{message}</Badge>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5">
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <LucideIcon name="Save" size={16} />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => {
          const info = categoryLabels[category] || { 
            label: category, 
            icon: 'Settings', 
            color: 'text-slate-600' 
          };

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <LucideIcon name={info.icon as any} size={18} className={info.color} />
                  {info.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categorySettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-700">
                        {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {setting.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderSettingInput(setting)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}