export interface WarningType {
  name: string;
  count: number;
  value: number;
  color?: string;
}

export interface TopWarning {
  name: string;
  count: number;
  value: number;
}

export interface WarningImage {
  id: number;
  image: string;
  event: string;
  time: string;
  alert_time: string;
  level: string;
  levelText: string;
  location: string;
  camera_name: string;
}

export interface CurrentWarningImage {
  image: string;
  event: string;
  time: string;
  level: string;
  levelText: string;
  location: string;
}

export interface WarningListItem {
  event: string;
  time: string;
  status: string;
  statusText: string;
}

export interface DeviceWarning {
  name: string;
  count: number;
}

export interface LocationInfo {
  location: string;
  weather: string;
  airQuality: string;
  loading: boolean;
}

export interface LoadingState {
  summary: boolean;
  trend: boolean;
  types: boolean;
  level: boolean;
  locations: boolean;
  processing: boolean;
  deviceStatus: boolean;
  warningList: boolean;
  warningImages: boolean;
}

export type UITimeRange = 'day' | 'week' | 'month';
