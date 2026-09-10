// src/features/platform-admin/integrations/pages/IntegrationsPage.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { useAuth } from '@/app/providers/AuthProvider';

interface IntegrationConfig {
  id: string;
  key: string;
  value: any;
  description: string;
  enabled: boolean;
  category: 'meetup' | 'google_places' | 'payment' | 'other';
}

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      // Fetch from app_config table
      const { data, error } = await supabase
        .from('app_config')
        .select('*')
        .in('key', [
          'meetup_api_key',
          'meetup_enabled',
          'meetup_search_radius',
          'google_places_api_key',
          'google_places_enabled',
          'google_places_search_radius',
          'payment_gateway_key',
          'payment_gateway_enabled',
        ]);

      if (error) throw error;

      // Map to integration configs
      const mapped: IntegrationConfig[] = (data || []).map((item: any) => ({
        id: item.id,
        key: item.key,
        value: item.value,
        description: getDescription(item.key),
        enabled: item.key.includes('enabled') ? item.value === 'true' : false,
        category: getCategory(item.key),
      }));

      setIntegrations(mapped);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'meetup_api_key': 'Meetup API key for event discovery',
      'meetup_enabled': 'Enable Meetup API integration',
      'meetup_search_radius': 'Default search radius for Meetup events (miles)',
      'google_places_api_key': 'Google Places API key for venue discovery',
      'google_places_enabled': 'Enable Google Places API integration',
      'google_places_search_radius': 'Default search radius for Google Places (meters)',
      'payment_gateway_key': 'Payment gateway API key for reward fulfillment',
      'payment_gateway_enabled': 'Enable payment gateway integration',
    };
    return descriptions[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCategory = (key: string): 'meetup' | 'google_places' | 'payment' | 'other' => {
    if (key.includes('meetup')) return 'meetup';
    if (key.includes('google_places')) return 'google_places';
    if (key.includes('payment')) return 'payment';
    return 'other';
  };

  const updateIntegration = (id: string, key: string, value: any) => {
    setIntegrations(integrations.map(i => 
      i.id === id ? { ...i, value } : i
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Update each integration
      for (const integration of integrations) {
        const { error } = await supabase
          .from('app_config')
          .update({ 
            value: integration.value,
            updated_at: new Date().toISOString() 
          })
          .eq('id', integration.id);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Integration settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving integrations:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingInput = (integration: IntegrationConfig) => {
    const value = integration.value;

    if (integration.key.includes('enabled')) {
      return (
        <Switch
          checked={value === 'true' || value === true}
          onCheckedChange={(checked) => updateIntegration(integration.id, integration.key, checked.toString())}
        />
      );
    } else if (typeof value === 'number' || integration.key.includes('radius')) {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => updateIntegration(integration.id, integration.key, parseInt(e.target.value) || 0)}
          className="w-32"
        />
      );
    } else {
      return (
        <Input
          type={integration.key.includes('key') ? 'password' : 'text'}
          value={value || ''}
          onChange={(e) => updateIntegration(integration.id, integration.key, e.target.value)}
          className="w-64"
          placeholder={`Enter ${integration.key.replace(/_/g, ' ')}`}
        />
      );
    }
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) acc[integration.category] = [];
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, IntegrationConfig[]>);

  const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
    meetup: { label: 'Meetup API', icon: 'Users', color: 'text-red-600' },
    google_places: { label: 'Google Places API', icon: 'MapPin', color: 'text-blue-600' },
    payment: { label: 'Payment Gateway', icon: 'CreditCard', color: 'text-emerald-600' },
    other: { label: 'Other Integrations', icon: 'Plug', color: 'text-slate-600' },
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading integrations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">API Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Manage third-party API integrations for the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <Badge variant={message.type === 'success' ? 'success' : 'destructive'}>
              {message.text}
            </Badge>
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
                Save Integrations
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Integrations Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => {
          const info = categoryLabels[category] || { 
            label: category, 
            icon: 'Plug', 
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
                {categoryIntegrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-700">
                        {integration.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {integration.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderSettingInput(integration)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2.5">
          <LucideIcon name="Info" size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Integration Security</p>
            <p className="text-xs text-amber-700 mt-0.5">
              API keys and credentials are stored securely. Only Platform Administrators can configure these integrations.
              Changes take effect immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}