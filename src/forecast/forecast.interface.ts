export interface ShortInfo {
  baseDate: string;
  baseTime: string;
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

export interface Report {
  maxTmp?: number;
  minTmp?: number;
  maxPop?: {
    value: number;
    time: string;
  };
}

export interface WeatherMetadata {
  date?: string;
  time: string;
  sky: string;
  tmp: string;
  pop?: string;
  pty: string;
}

export interface Day {
  report: Report;
  timeline: WeatherMetadata[];
}

export interface TodayInfo {
  [key: string]: {
    report: Report;
    timeline: WeatherMetadata[];
  };
}

export enum FCST_TIMES {
  CACHE_TTL = 60 * 60 * 4,
  BASE_COUNT_TTL = 60 * 60 * 24 * 3,
}
