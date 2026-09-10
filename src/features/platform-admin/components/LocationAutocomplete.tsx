// src/features/platform-admin/components/LocationAutocomplete.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { LucideIcon } from '@/components/ui/LucideIcon';

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, placeData?: any) => void;
  placeholder?: string;
  className?: string;
  onPlaceSelect?: (place: any) => void;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className = '',
  onPlaceSelect,
}: LocationAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    // If there's a value and it's not from Google Places, show it in manual mode
    if (value && !selectedPlace) {
      setManualLocation(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadConfig = async () => {
    setIsConfigLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'google_places_config')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const config = data.value;
        setIsEnabled(config?.enabled || false);
        setApiKey(config?.api_key || null);
      } else {
        setIsEnabled(false);
        setApiKey(null);
      }
    } catch (error) {
      console.error('Error loading Google Places config:', error);
      setIsEnabled(false);
      setApiKey(null);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const fetchPredictions = useCallback(async (input: string) => {
    if (!input || input.length < 2 || !isEnabled || !apiKey) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=geocode|establishment`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setPredictions(data.predictions.map((p: any) => ({
          description: p.description,
          place_id: p.place_id,
          structured_formatting: p.structured_formatting,
          types: p.types || [],
        })));
        setIsOpen(data.predictions.length > 0);
      } else {
        setPredictions([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, apiKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // If in manual mode, update manual location
    if (isManualMode) {
      setManualLocation(newValue);
      onChange(newValue, null);
      return;
    }

    // Otherwise, search with Google Places
    onChange(newValue, null);
    setSelectedPlace(null);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    if (!apiKey) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${apiKey}&fields=name,formatted_address,geometry,types,rating,user_ratings_total,photos,url,website,formatted_phone_number,vicinity`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const placeDetails = {
          place_id: result.place_id,
          name: result.name,
          formatted_address: result.formatted_address || result.vicinity || '',
          geometry: result.geometry,
          types: result.types || [],
          rating: result.rating,
          user_ratings_total: result.user_ratings_total,
          photos: result.photos?.map((p: any) => ({
            photo_reference: p.photo_reference,
            height: p.height,
            width: p.width,
          })),
          url: result.url,
          website: result.website,
          formatted_phone_number: result.formatted_phone_number,
          vicinity: result.vicinity,
        };

        setSelectedPlace(placeDetails);
        onChange(prediction.description, placeDetails);
        setIsOpen(false);
        setIsManualMode(false);
        setManualLocation('');
        if (onPlaceSelect) {
          onPlaceSelect(placeDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const toggleManualMode = () => {
    setIsManualMode(!isManualMode);
    if (!isManualMode) {
      // Switching to manual mode - clear Google Places data
      setPredictions([]);
      setIsOpen(false);
      setSelectedPlace(null);
      setManualLocation(value || '');
    } else {
      // Switching back to autocomplete mode
      setManualLocation('');
      if (value) {
        fetchPredictions(value);
      }
    }
  };

  const handleManualLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setManualLocation(newValue);
    onChange(newValue, null);
  };

  // Show loading state while config is loading
  if (isConfigLoading) {
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <LucideIcon name="MapPin" size={16} />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value, null)}
          placeholder={placeholder}
          className={`pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${className}`}
          disabled
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // If Google Places is not enabled or no API key, show manual input only
  if (!isEnabled || !apiKey) {
    return (
      <div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <LucideIcon name="MapPin" size={16} />
          </div>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value, null)}
            placeholder="Enter location manually (e.g., New York, NY)"
            className={`pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${className}`}
          />
        </div>
        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
          <LucideIcon name="Info" size={12} />
          Enter location manually. To enable Google Places autocomplete, add API key in Platform Settings → Integrations.
        </p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleManualMode}
            className={`text-xs font-medium px-2 py-0.5 rounded transition-colors ${
              !isManualMode 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LucideIcon name="Search" size={12} className="inline mr-1" />
            Search
          </button>
          <span className="text-xs text-muted-foreground">|</span>
          <button
            type="button"
            onClick={toggleManualMode}
            className={`text-xs font-medium px-2 py-0.5 rounded transition-colors ${
              isManualMode 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LucideIcon name="Edit" size={12} className="inline mr-1" />
            Manual
          </button>
        </div>
        {isManualMode && (
          <span className="text-[10px] text-muted-foreground">Type location name</span>
        )}
      </div>

      {isManualMode ? (
        // Manual Input Mode
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <LucideIcon name="Edit" size={16} />
          </div>
          <Input
            value={manualLocation}
            onChange={handleManualLocationChange}
            placeholder="Enter location name (e.g., Central Park, New York)"
            className={`pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${className}`}
          />
          {manualLocation && (
            <button
              type="button"
              onClick={() => {
                setManualLocation('');
                onChange('', null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <LucideIcon name="X" size={16} />
            </button>
          )}
        </div>
      ) : (
        // Google Places Autocomplete Mode
        <>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <LucideIcon name="MapPin" size={16} />
            </div>
            <Input
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (predictions.length > 0 && value.length > 1) {
                  setIsOpen(true);
                }
              }}
              placeholder={placeholder}
              className={`pl-9 pr-10 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${className}`}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {value && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  onChange('', null);
                  setSelectedPlace(null);
                  setPredictions([]);
                  setIsOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <LucideIcon name="X" size={16} />
              </button>
            )}
          </div>

          {isOpen && predictions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  type="button"
                  onClick={() => handleSelectPlace(prediction)}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-start gap-3 border-b border-slate-100 last:border-0"
                >
                  <div className="mt-0.5 text-slate-400">
                    <LucideIcon name="MapPin" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">
                      {prediction.structured_formatting?.main_text || prediction.description}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {prediction.structured_formatting?.secondary_text || ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selectedPlace && !isManualMode && (
        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
          <LucideIcon name="CheckCircle" size={16} className="text-emerald-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-700 font-medium">Location selected</p>
            <p className="text-xs text-emerald-600 truncate">{selectedPlace.name}</p>
            {selectedPlace.formatted_address && (
              <p className="text-[10px] text-emerald-500 truncate">{selectedPlace.formatted_address}</p>
            )}
          </div>
        </div>
      )}

      {/* Show powered by Google only in search mode */}
      {!isManualMode && isEnabled && apiKey && (
        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          <LucideIcon name="Map" size={10} />
          Powered by Google Places
        </p>
      )}
    </div>
  );
}