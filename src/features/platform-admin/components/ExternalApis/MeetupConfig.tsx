// src/features/platform-admin/components/ExternalApis/MeetupConfig.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { useExternalApis } from '../../hooks/useExternalApis';

export function MeetupConfig() {
  const { meetup, updateMeetup, testMeetup } = useExternalApis();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testMeetup();
      setTestResult(result);
    } catch (error) {
      setTestResult('❌ Connection failed. Please check your credentials.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    updateMeetup(meetup);
    // Show success notification
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LucideIcon name="Users" size={20} />
            <span>Meetup API Control</span>
            <Badge variant={meetup.enabled ? 'success' : 'secondary'}>
              {meetup.enabled ? 'Connected' : 'Disabled'}
            </Badge>
          </CardTitle>
          <Switch
            checked={meetup.enabled}
            onCheckedChange={(checked) => updateMeetup({ ...meetup, enabled: checked })}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">API Endpoint URL</label>
            <Input
              value={meetup.endpoint}
              onChange={(e) => updateMeetup({ ...meetup, endpoint: e.target.value })}
              placeholder="https://api.meetup.com/find/upcoming_events"
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">OAuth / API Access Key</label>
            <Input
              type="password"
              value={meetup.apiKey}
              onChange={(e) => updateMeetup({ ...meetup, apiKey: e.target.value })}
              placeholder="mu_oauth_live_..."
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Target Environment</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={meetup.environment}
              onChange={(e) => updateMeetup({ ...meetup, environment: e.target.value as 'production' | 'sandbox' })}
            >
              <option value="production">Production (Live Meetup Nodes)</option>
              <option value="sandbox">Sandbox / Staging</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Default Geo Search Radius (Miles)</label>
            <Input
              type="number"
              value={meetup.searchRadiusMiles}
              onChange={(e) => updateMeetup({ ...meetup, searchRadiusMiles: parseInt(e.target.value) || 25 })}
              min={5}
              max={100}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Sync Interval (Minutes)</label>
            <Input
              type="number"
              value={meetup.syncIntervalMinutes}
              onChange={(e) => updateMeetup({ ...meetup, syncIntervalMinutes: parseInt(e.target.value) || 30 })}
              min={5}
              max={1440}
            />
          </div>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={meetup.autoDiscoverNewGroups}
                onChange={(e) => updateMeetup({ ...meetup, autoDiscoverNewGroups: e.target.checked })}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span className="text-sm font-medium">Auto-discover new local interest groups</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleTest} 
              disabled={isTesting}
              variant="outline"
            >
              {isTesting ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <LucideIcon name="RefreshCw" size={14} className="mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            {testResult && (
              <span className={`text-sm ${testResult.includes('failed') ? 'text-red-600' : 'text-emerald-600'}`}>
                {testResult}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Last Sync: {meetup.lastSyncTimestamp ? new Date(meetup.lastSyncTimestamp).toLocaleString() : 'Never'}</span>
            <Button onClick={handleSave} size="sm">
              <LucideIcon name="Save" size={14} className="mr-1.5" />
              Save Configuration
            </Button>
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-muted">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <LucideIcon name="Info" size={16} />
            Feed Architecture Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-background rounded-lg border">
              <div className="font-bold text-xs uppercase text-muted-foreground mb-1">Employee View</div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Browse live event feeds filtered by city hub and interest domains to join local activities
              </p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <div className="font-bold text-xs uppercase text-muted-foreground mb-1">Employer View</div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Browse city-tailored social feeds to suggest and publish community events to their team
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="font-bold text-xs uppercase text-red-700 mb-1">App Owner Governance</div>
              <p className="text-red-600 text-xs leading-relaxed">
                All API keys, rate limit quotas, endpoint configs, and ping tests are centralized here
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MeetupConfig;