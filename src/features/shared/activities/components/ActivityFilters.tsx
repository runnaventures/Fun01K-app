// src/features/activities/components/ActivityFilters.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from '@/components/ui/LucideIcon';

interface ActivityFiltersProps {
  filters: {
    city: string;
    category: string;
    search: string;
    source: string;
  };
  onFiltersChange: (filters: any) => void;
  showSourceFilter?: boolean;
}

const CITIES = ['All Cities', 'Atlanta', 'San Francisco', 'New York', 'Austin', 'Seattle', 'Chicago', 'Denver', 'London'];
const CATEGORIES = ['All', 'Learning', 'Sports', 'Wellness', 'Hobby', 'Social'];
const SOURCES = ['All', 'company', 'meetup', 'places', 'employee'];

export function ActivityFilters({ 
  filters, 
  onFiltersChange, 
  showSourceFilter = false 
}: ActivityFiltersProps) {
  const [showCustomCity, setShowCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');

  const handleCityChange = (city: string) => {
    if (city === '++ Custom City') {
      setShowCustomCity(true);
    } else {
      setShowCustomCity(false);
      onFiltersChange({ ...filters, city });
    }
  };

  const handleCustomCityAdd = () => {
    if (customCity.trim()) {
      onFiltersChange({ ...filters, city: customCity.trim() });
      setShowCustomCity(false);
      setCustomCity('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <LucideIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Search activities, groups, or keywords..."
          className="pl-10 py-6 text-sm"
        />
      </div>

      {/* City Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">City Hub:</span>
        {CITIES.map((city) => (
          <Button
            key={city}
            variant={filters.city === city ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCityChange(city)}
            className="text-xs"
          >
            {city === 'All Cities' ? '🌍' : city === '++ Custom City' ? '➕' : '📍'} {city}
          </Button>
        ))}
      </div>

      {/* Custom City Input */}
      {showCustomCity && (
        <div className="flex items-center gap-2">
          <Input
            value={customCity}
            onChange={(e) => setCustomCity(e.target.value)}
            placeholder="Enter custom city name..."
            className="w-48"
          />
          <Button size="sm" onClick={handleCustomCityAdd}>Add</Button>
          <Button variant="outline" size="sm" onClick={() => setShowCustomCity(false)}>Cancel</Button>
        </div>
      )}

      {/* Category & Source Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground mr-1">Category:</span>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={filters.category === cat.toLowerCase() ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, category: cat.toLowerCase() })}
              className="text-xs"
            >
              {cat}
            </Button>
          ))}
        </div>

        {showSourceFilter && (
          <div className="flex items-center gap-1 ml-4">
            <span className="text-xs font-medium text-muted-foreground mr-1">Source:</span>
            {SOURCES.map((src) => (
              <Button
                key={src}
                variant={filters.source === src ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, source: src as any })}
                className="text-xs capitalize"
              >
                {src === 'all' ? 'All' : src}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}