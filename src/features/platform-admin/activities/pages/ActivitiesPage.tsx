// src/features/platform-admin/activities/pages/ActivitiesPage.tsx

import { useState } from 'react';
import { ActivityFeed } from '@/features/shared/activities/components/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { useActivityPermissions } from '@/features/shared/activities/hooks/useActivityPermissions';
import { AddActivityDialog } from '@/features/platform-admin/components/ActivitiesManager/AddActivityDialog';

export default function PlatformActivitiesPage() {
  const { canManageMeetupApi, canManageGooglePlaces, canCreateActivity } = useActivityPermissions();
  const [meetupEnabled, setMeetupEnabled] = useState(false);
  const [placesEnabled, setPlacesEnabled] = useState(false);
  const [meetupApiKey, setMeetupApiKey] = useState('');
  const [placesApiKey, setPlacesApiKey] = useState('');

  return (
    <div className="space-y-6">
      {/* Header with Create Activity Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Activities</h1>
          <p className="text-muted-foreground">
            Manage activities across all organizations
          </p>
        </div>
        {canCreateActivity() && (
          <AddActivityDialog onActivityCreated={() => window.location.reload()}>
            <Button className="flex items-center gap-2">
              <LucideIcon name="Plus" size={16} />
              Create Activity
            </Button>
          </AddActivityDialog>
        )}
      </div>

      {/* Activity Feed */}
      <ActivityFeed tab="featured" isAdmin={true} />

      {/* API Configuration (Platform Owner Only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Meetup API Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <LucideIcon name="Users" size={18} />
                Meetup API
              </CardTitle>
              <Switch
                checked={meetupEnabled}
                onCheckedChange={setMeetupEnabled}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                value={meetupApiKey}
                onChange={(e) => setMeetupApiKey(e.target.value)}
                placeholder="Enter Meetup API key..."
                disabled={!canManageMeetupApi()}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Search Radius (miles)</label>
              <Input
                type="number"
                defaultValue={25}
                disabled={!canManageMeetupApi()}
              />
            </div>
            <Button disabled={!canManageMeetupApi()} className="w-full">
              Save Meetup Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Google Places API Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <LucideIcon name="MapPin" size={18} />
                Google Places API
              </CardTitle>
              <Switch
                checked={placesEnabled}
                onCheckedChange={setPlacesEnabled}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                value={placesApiKey}
                onChange={(e) => setPlacesApiKey(e.target.value)}
                placeholder="Enter Google Places API key..."
                disabled={!canManageGooglePlaces()}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Search Radius (meters)</label>
              <Input
                type="number"
                defaultValue={15000}
                disabled={!canManageGooglePlaces()}
              />
            </div>
            <Button disabled={!canManageGooglePlaces()} className="w-full">
              Save Places Configuration
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}