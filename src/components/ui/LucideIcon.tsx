// src/components/ui/LucideIcon.tsx

import * as LucideIcons from 'lucide-react';

export type IconName = keyof typeof LucideIcons;

interface LucideIconProps {
  name: IconName | string;
  size?: number;
  className?: string;
}

export function LucideIcon({ name, size = 20, className = '' }: LucideIconProps) {
  // Handle dynamic icon lookup
  const IconComponent = (LucideIcons as any)[name];
  
  if (!IconComponent) {
    return <span className={className}>⚠️</span>;
  }
  
  // Create a wrapper to handle the icon
  return <IconComponent size={size} className={className} />;
}

export default LucideIcon;