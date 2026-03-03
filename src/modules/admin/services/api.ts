import { AppConfig, Metric } from '../types';

export const fetchConfig = async (): Promise<AppConfig> => {
  return {
    platformName: 'System Admin',
    environment: 'Production',
    categories: []
  };
};

/**
 * Fetches metrics for a specific service.
 */
export const fetchServiceMetrics = async (_serviceId: string): Promise<Metric[]> => {
  return [
    { label: 'CPU', value: `${Math.floor(Math.random() * 20) + 5}%` },
    { label: 'Memory', value: `${Math.floor(Math.random() * 500) + 100}MB` }
  ];
};



