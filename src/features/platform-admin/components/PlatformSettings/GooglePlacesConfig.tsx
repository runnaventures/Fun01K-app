// src/features/platform-admin/components/PlatformSettings/GooglePlacesConfig.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LucideIcon } from '@/components/ui/LucideIcon';

export function GooglePlacesConfig() {
  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
        const config = data.value;
        setApiKey(config?.api_key || '');
        setEnabled(config?.enabled || false);
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
      const config = {
        api_key: apiKey.trim(),
        enabled: enabled,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'google_places_config',
          value: config,
          description: 'Google Places API configuration for location autocomplete',
          category: 'integrations',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Google Places configuration saved successfully!' });
    } catch (error) {
      console.error('Error saving Google Places config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestApi = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key first.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=coffee&key=${apiKey.trim()}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        setMessage({ type: 'success', text: 'API key is valid! Google Places is working.' });
      } else if (data.status === 'REQUEST_DENIED') {
        setMessage({ type: 'error', text: 'API key is invalid or has insufficient permissions. Please check your key and enable Places API.' });
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        setMessage({ type: 'error', text: 'API quota exceeded. Please check your billing settings.' });
      } else {
        setMessage({ type: 'error', text: `API error: ${data.status}. Please check your configuration.` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test API. Please check your internet connection.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <LucideIcon name="MapPin" size={18} />
            Google Places API
          </CardTitle>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">API Key</label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter Google Places API key..."
            className="mt-1"
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
            . Enable the Places API for your project.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestApi}
            disabled={isLoading || !apiKey.trim()}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
                Testing...
              </>
            ) : (
              <>
                <LucideIcon name="CheckCircle" size={14} className="mr-2" />
                Test API Key
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg flex items-start gap-2.5 ${
            message.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <LucideIcon 
              name={message.type === 'success' ? 'CheckCircle' : 'AlertCircle'} 
              size={16} 
              className="shrink-0 mt-0.5" 
            />
            <span className="text-sm">{message.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}