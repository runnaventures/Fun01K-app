import { LoadingSpinner } from './LoadingSpinner';

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <LoadingSpinner size="lg" className="text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}