// src/features/platform-admin/components/ExternalApis/GooglePlacesConfig.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { LucideIcon } from '@/components/ui/LucideIcon';

interface GooglePlacesConfig {
  enabled: boolean;
  apiKey: string;
  mapId: string;
  defaultBiasingCity: string;
  searchRadiusMeters: number;
  maxResultCount: number;
  sdkStatus: 'connected' | 'disconnected';
}

export function GooglePlacesConfig() {
  const [config, setConfig] = useState<GooglePlacesConfig>({
    enabled: false,
    apiKey: '',
    mapId: '',
    defaultBiasingCity: 'Atlanta',
    searchRadiusMeters: 15000,
    maxResultCount: 15,
    sdkStatus: 'disconnected',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'google_places_config')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const savedConfig = data.value;
        setConfig({
          enabled: savedConfig?.enabled || false,
          apiKey: savedConfig?.api_key || '',
          mapId: savedConfig?.map_id || '',
          defaultBiasingCity: savedConfig?.default_biasing_city || 'Atlanta',
          searchRadiusMeters: savedConfig?.search_radius_meters || 15000,
          maxResultCount: savedConfig?.max_result_count || 15,
          sdkStatus: savedConfig?.sdk_status || 'disconnected',
        });
      }
    } catch (error) {
      console.error('Error loading Google Places config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const configData = {
        enabled: config.enabled,
        api_key: config.apiKey.trim(),
        map_id: config.mapId.trim(),
        default_biasing_city: config.defaultBiasingCity,
        search_radius_meters: config.searchRadiusMeters,
        max_result_count: config.maxResultCount,
        sdk_status: config.sdkStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'google_places_config',
          value: configData,
          description: 'Google Places API configuration for location autocomplete and venue discovery',
          category: 'integrations',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Google Places configuration saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving Google Places config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.apiKey.trim()) {
      setTestResult('❌ Please enter an API key first.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=coffee&key=${config.apiKey.trim()}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        setTestResult('✅ API key is valid! Google Places is working.');
        setConfig({ ...config, sdkStatus: 'connected' });
      } else if (data.status === 'REQUEST_DENIED') {
        setTestResult('❌ API key is invalid or has insufficient permissions. Please check your key and enable Places API.');
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        setTestResult('❌ API quota exceeded. Please check your billing settings.');
      } else {
        setTestResult(`❌ API error: ${data.status}. Please check your configuration.`);
      }
    } catch (error) {
      setTestResult('❌ Failed to test API. Please check your internet connection.');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading Google Places configuration...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LucideIcon name="MapPin" size={20} />
            <span>Google Places API</span>
            <Badge variant={config.enabled ? 'success' : 'secondary'}>
              {config.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <Badge variant={config.sdkStatus === 'connected' ? 'success' : 'secondary'}>
              {config.sdkStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
            </Badge>
          </CardTitle>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">API Key *</label>
            <Input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get your API key from the{' '}
              <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Google Cloud Console
              </a>
              . Enable Places API and Maps JavaScript API.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Map ID (optional)</label>
            <Input
              value={config.mapId}
              onChange={(e) => setConfig({ ...config, mapId: e.target.value })}
              placeholder="DEMO_MAP_ID"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional map ID for custom map styles. Leave empty to use default.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Default Biasing City</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={config.defaultBiasingCity}
              onChange={(e) => setConfig({ ...config, defaultBiasingCity: e.target.value })}
            >
              <option value="Atlanta">Atlanta, GA</option>
              <option value="San Francisco">San Francisco, CA</option>
              <option value="Austin">Austin, TX</option>
              <option value="New York">New York, NY</option>
              <option value="Seattle">Seattle, WA</option>
              <option value="Chicago">Chicago, IL</option>
              <option value="Denver">Denver, CO</option>
              <option value="London">London, UK</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Search Radius (meters)</label>
            <Input
              type="number"
              value={config.searchRadiusMeters}
              onChange={(e) => setConfig({ ...config, searchRadiusMeters: parseInt(e.target.value) || 15000 })}
              min={1000}
              max={50000}
            />
            <p className="text-xs text-muted-foreground mt-1">Default: 15000 (15km)</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Max Results</label>
            <Input
              type="number"
              value={config.maxResultCount}
              onChange={(e) => setConfig({ ...config, maxResultCount: parseInt(e.target.value) || 15 })}
              min={5}
              max={60}
            />
            <p className="text-xs text-muted-foreground mt-1">Default: 15</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
          <Button onClick={handleTest} disabled={isTesting || !config.apiKey.trim()} variant="outline">
            {isTesting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Testing...
              </>
            ) : (
              <>
                <LucideIcon name="RefreshCw" size={14} className="mr-2" />
                Test API Key
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
          {testResult && (
            <span className={`text-sm ${testResult.includes('✅') ? 'text-emerald-600' : 'text-red-600'}`}>
              {testResult}
            </span>
          )}
          {message && (
            <span className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          )}
        </div>

        {/* Documentation */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-muted">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <LucideIcon name="Info" size={16} />
            Google Places Integration
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Enables location autocomplete when creating activities</li>
            <li>Auto-detects venue details (name, address, coordinates)</li>
            <li>Stores place_id, lat/lng for map display and filtering</li>
            <li>Required: Enable Places API and Maps JavaScript API in Google Cloud Console</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}