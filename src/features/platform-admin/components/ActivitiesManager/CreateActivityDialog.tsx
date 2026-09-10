// src/features/platform-admin/components/ActivitiesManager/CreateActivityDialog.tsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { LocationAutocomplete } from '../LocationAutocomplete';