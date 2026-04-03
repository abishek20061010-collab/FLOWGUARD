import { Request } from 'express';

// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type UserRole = 'citizen' | 'admin' | 'fisherman';

export type ReportCategory =
  | 'choked_drain'
  | 'damaged_road'
  | 'waterlogging'
  | 'other';

export type ReportStatus =
  | 'reported'
  | 'assigned'
  | 'in_progress'
  | 'resolved';

export type Severity = 'low' | 'medium' | 'high';

export type AlertLevel = 'yellow' | 'orange' | 'red';

export type AlertType = 'cyclone' | 'flood' | 'high_winds' | 'storm_surge';

export type RiskLevel = 'normal' | 'yellow' | 'orange' | 'red';

export type NotificationChannel = 'fcm' | 'sms';

export type SOSStatus = 'active' | 'acknowledged' | 'resolved';

// ─── Core Interfaces ──────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  full_name: string;
  phone_number: string;
  role: UserRole;
  civic_coins: number;
  fcm_token: string | null;
  preferred_language: 'en' | 'ta';
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  category: ReportCategory;
  description: string | null;
  latitude: number;
  longitude: number;
  photo_url: string;
  status: ReportStatus;
  severity: Severity;
  blockage_type: string;
  assigned_to: string | null;
  resolution_photo_url: string | null;
  zone_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Zone {
  id: string;
  name: string;
  ward_number: string;
  is_coastal: boolean;
  risk_level: RiskLevel;
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
  created_at?: string;
}

export interface Alert {
  id: string;
  zone_id: string;
  alert_type: AlertType;
  severity_level: AlertLevel;
  title: string;
  message: string;
  is_active: boolean;
  triggered_at: string;
  expires_at: string;
}

export interface SOSEvent {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  status: SOSStatus;
  sms_sent: boolean;
  fcm_sent: boolean;
  notes: string | null;
  created_at: string;
}

export interface TriageResult {
  severity: Severity;
  blockage_type: string;
  confidence: number;
}

export interface WeatherData {
  wind_speed_kmh: number;
  wave_height_m: number;
  tide_time: string | null;
  temperature_c: number;
  humidity: number;
  description: string;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─── Express Request Extensions ───────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}
