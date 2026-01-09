/**
 * Dashboard types for Design Engineer widgets
 */

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'status';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  refreshable: boolean;
  configurable: boolean;
  data: any;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
  spacing: number;
}

export interface DoorsPackageStatus {
  pending: number;
  received: number;
  reviewed: number;
  total: number;
}

export interface RfqStatusData {
  draft: number;
  issued: number;
  awarded: number;
  total: number;
}

export interface ComplianceData {
  rate: number;
  target: number;
  reviewed: number;
  total: number;
}

export interface ProcessingTimeData {
  average: number;
  benchmark: number;
  trend: 'up' | 'down' | 'stable';
  history: Array<{ date: string; value: number }>;
}

export interface RecentActivity {
  id: string;
  type: 'package' | 'rfq';
  title: string;
  status: string;
  timestamp: number;
  action: string;
}
