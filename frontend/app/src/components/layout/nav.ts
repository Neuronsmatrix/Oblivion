import type { LucideIcon } from 'lucide-react';
import {
  Folder, ScanFace, Dna, Microscope, Bell, User,
  Layers, Upload, Gauge, CreditCard,
} from 'lucide-react';
import type { Role } from '../../lib/api/types';

export interface NavItem {
  to: string;
  /** i18n key in the `nav` namespace. */
  key: string;
  icon: LucideIcon;
  end?: boolean;
}

const doctorNav: NavItem[] = [
  { to: '/app/cases', key: 'cases', icon: Folder, end: true },
  { to: '/app/cases/new', key: 'newAnalysis', icon: ScanFace },
  { to: '/app/syndromes', key: 'syndromes', icon: Dna },
  { to: '/app/atlas', key: 'atlas', icon: Microscope },
  { to: '/app/notifications', key: 'notifications', icon: Bell },
  { to: '/app/profile', key: 'profile', icon: User },
];

const labNav: NavItem[] = [
  { to: '/app/batches', key: 'batches', icon: Layers, end: true },
  { to: '/app/batches/new', key: 'newBatch', icon: Upload },
  { to: '/app/usage', key: 'usage', icon: Gauge },
  { to: '/app/billing', key: 'billing', icon: CreditCard },
  { to: '/app/syndromes', key: 'syndromes', icon: Dna },
  { to: '/app/notifications', key: 'notifications', icon: Bell },
  { to: '/app/profile', key: 'profile', icon: User },
];

export function navForRole(role: Role): NavItem[] {
  return role === 'lab' ? labNav : doctorNav;
}

/** Where each role lands at /app. */
export function homeForRole(role: Role): string {
  return role === 'lab' ? '/app/usage' : '/app/cases';
}
