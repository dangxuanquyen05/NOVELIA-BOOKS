export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface SystemHealthData {
  status: string;
  application: string;
  version: string;
  environment: string;
  systemTime: string;
}
