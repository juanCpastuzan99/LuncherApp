export interface App {
  id: string;
  name: string;
  path: string;
  ext: string;
  type: string;
}

export interface LaunchHistoryItem {
  id: string;
  timestamp: number;
  appName: string;
}

