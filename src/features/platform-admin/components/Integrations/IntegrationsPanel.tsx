// src/features/platform-admin/components/Integrations/IntegrationsPanel.tsx

import { useState } from 'react';
import { Calendar, MapPin, Plug, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { MeetupConfig } from '../ExternalApis/MeetupConfig';
import { GooglePlacesConfig } from '../ExternalApis/GooglePlacesConfig';

type IntegrationTab = 'meetup' | 'places';

type Status = 'idle' | 'testing' | 'ok' | 'error';

export function IntegrationsPanel() {
  const [tab, setTab] = useState<IntegrationTab>('meetup');
  const [placesStatus, setPlacesStatus] = useState<Status>('idle');
  const [placesResult, setPlacesResult] = useState<string | null>(null);

  const tabs: { id: IntegrationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'meetup', label: 'Meetup API', icon: <Calendar className="h-4 w-4" /> },
    { id: 'places', label: 'Google Places API', icon: <MapPin className="h-4 w-4" /> },
  ];

  const testPlaces = async () => {
    setPlacesStatus('testing');
    setPlacesResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('places-search', {
        body: { city: 'Atlanta', maxResults: 3 },
      });
      if (error) throw error;
      const count = (data as any)?.places?.length ?? 0;
      if (count === 0) {
        setPlacesResult('Connected, but no places returned. Check the key restrictions.');
        setPlacesStatus('error');
      } else {
        setPlacesResult(`Connected — received ${count} places from Google`);
        setPlacesStatus('ok');
      }
    } catch (err: any) {
      setPlacesResult(`Failed: ${err?.message || 'unknown error'}`);
      setPlacesStatus('error');
    }
  };

  return (
    <div className="space-y-5">
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

      <div>
        {tab === 'meetup' && <MeetupConfig />}
        {tab === 'places' && (
          <div className="space-y-4">
            <GooglePlacesConfig />

            {/* Status + test card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Connection Status
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    The API key is stored securely in Supabase Edge Function secrets.
                    This panel verifies the function can reach Google.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {placesStatus === 'ok' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connected
                    </span>
                  )}
                  {placesStatus === 'error' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-700 ring-1 ring-rose-200">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Not configured
                    </span>
                  )}
                  {placesStatus === 'testing' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Testing…
                    </span>
                  )}
                  {placesStatus === 'idle' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
                      Untested
                    </span>
                  )}
                </div>
              </div>

              {placesResult && (
                <p
                  className={cn(
                    'mt-3 rounded-xl px-3 py-2 text-xs font-medium',
                    placesStatus === 'ok'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  )}
                >
                  {placesResult}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={testPlaces}
                  disabled={placesStatus === 'testing'}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {placesStatus === 'testing' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Testing…
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5" />
                      Test Places API
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400">
                  To rotate the key: Supabase dashboard → Project Settings → Edge
                  Functions → Secrets → update <code>GOOGLE_PLACES_API_KEY</code>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}