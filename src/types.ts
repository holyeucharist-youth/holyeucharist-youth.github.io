export type Role = 'USER' | 'ADMIN';

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'LEAVE'
  | 'WFH'
  | 'HALF_DAY'
  | 'ABSENT';

export interface User {
  email: string;
  name: string;
  role: Role;
  is_active?: boolean;
  created_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  expiresIn: number;
  user: User;
}

export interface AttendanceRecord {
  id: number;
  user_email: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: AttendanceStatus;
  reason: string | null;
  minutes_late: number;
  check_in_lat?: number | null;
  check_in_lng?: number | null;
  check_in_accuracy?: number | null;
  location_id?: number | null;
  name?: string;
}

export interface TodayResponse {
  date: string;
  record: AttendanceRecord | null;
}

export interface MarkAttendanceRequest {
  status: AttendanceStatus;
  lat?: number;
  lng?: number;
  accuracy?: number;
  reason?: string;
}

export interface MarkAttendanceResponse {
  ok: boolean;
  date: string;
  status: AttendanceStatus;
  minutesLate: number;
  locationId: number | null;
  checkInTime: string;
}

export interface CheckoutResponse {
  ok: boolean;
  checkOutTime: string;
}

export interface StatsCounts {
  PRESENT: number;
  LATE: number;
  LEAVE: number;
  WFH: number;
  HALF_DAY: number;
  ABSENT: number;
}

export interface StatsResponse {
  period: string;
  counts: StatsCounts;
}

export interface Scorecard {
  totalLoggedIn: number;
  present: number;
  late: number;
  leave: number;
  wfh: number;
  halfDay: number;
  absent: number;
}

export interface DailyReportRow {
  user_email: string;
  name: string;
  status: AttendanceStatus;
  check_in_time: string | null;
  check_out_time: string | null;
  minutes_late: number;
  reason: string | null;
}

export interface DailyReportResponse {
  date: string;
  scorecards: Scorecard;
  list: DailyReportRow[];
}

export interface MonthlyReportRow {
  email: string;
  name: string;
  present: number;
  late: number;
  leaves: number;
  wfh: number;
  half_day: number;
  absent: number;
  total_marked: number;
}

export interface MonthlyReportResponse {
  month: string;
  rows: MonthlyReportRow[];
}

export interface RangeReportRow extends AttendanceRecord {
  name: string;
}

export interface RangeReportResponse {
  from: string;
  to: string;
  rows: RangeReportRow[];
}

export interface LeaderboardRow {
  email: string;
  name: string;
  score: number;
  days: number;
}

export interface LeaderboardResponse {
  period: string;
  key: string;
  rows: LeaderboardRow[];
}

export interface LateReportRow {
  user_email: string;
  name: string;
  late_count: number;
  avg_minutes_late: number;
  max_minutes_late: number;
}

export interface TimeConfig {
  expectedLoginTime: string;
  gracePeriodMinutes: number;
  expectedLogoutTime: string;
  workingDays: number[];
  timezone: string;
  minGpsAccuracyMeters: number;
  geofencingEnabled: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
}
