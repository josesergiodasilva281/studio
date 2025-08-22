export interface LogEntry {
  timestamp: Date;
  user: string;
  status: 'granted' | 'denied';
}
