// src/features/platform-admin/components/Integrations/IntegrationsPanel.tsx

import { useState } from 'react';
import { Calendar, MapPin, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeetupConfig } from '../ExternalApis/MeetupConfig';
import { GooglePlacesConfig } from '../ExternalApis/GooglePlacesConfig';

type IntegrationTab = 'meetup' | 'places';

export function IntegrationsPanel() {
  const [tab, setTab] = useState<IntegrationTab>('meetup');

  const tabs: { id: IntegrationTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'meetup',
      label: 'Meetup API',
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      id: 'places',
      label: 'Google Places API',
      icon: <MapPin className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Plug className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">External Integrations</h2>
          <p className="text-xs text-muted-foreground">
            Configure API connections and external data sources
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
              tab === t.id
                ? 'bg-slate-900 text-white'
                : 'border bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === 'meetup' && <MeetupConfig />}
        {tab === 'places' && <GooglePlacesConfig />}
      </div>
    </div>
  );
}
