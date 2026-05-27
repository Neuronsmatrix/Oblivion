import type { LucideIcon } from 'lucide-react';
import {
  Folder, ScanFace, Dna, Microscope, Bell, User,
  Layers, Upload, Gauge, CreditCard,
} from 'lucide-react';
import type { Role } from '../../lib/api/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const doctorNav: NavItem[] = [
  { to: '/app/cases', label: 'Cases', icon: Folder, end: true },
  { to: '/app/cases/new', label: 'New analysis', icon: ScanFace },
  { to: '/app/syndromes', label: 'Syndromes', icon: Dna },
  { to: '/app/atlas', label: 'Feature atlas', icon: Microscope },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/profile', label: 'Profile', icon: User },
];

const labNav: NavItem[] = [
  { to: '/app/batches', label: 'Batches', icon: Layers, end: true },
  { to: '/app/batches/new', label: 'New batch', icon: Upload },
  { to: '/app/usage', label: 'Usage', icon: Gauge },
  { to: '/app/billing', label: 'Billing', icon: CreditCard },
  { to: '/app/syndromes', label: 'Syndromes', icon: Dna },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export function navForRole(role: Role): NavItem[] {
  return role === 'lab' ? labNav : doctorNav;
}

/** Where each role lands at /app. */
export function homeForRole(role: Role): string {
  return role === 'lab' ? '/app/usage' : '/app/cases';
}
