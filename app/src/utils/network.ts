/**
 * Network utilities for HomeHelp app
 */

import NetInfo from '@react-native-community/netinfo';
import { logAPI } from './logger';

export interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
}

export async function checkNetworkStatus(): Promise<NetworkStatus> {
  try {
    const netInfo = await NetInfo.fetch();
    const status: NetworkStatus = {
      isConnected: netInfo.isConnected,
      isInternetReachable: netInfo.isInternetReachable,
      type: netInfo.type,
    };
    
    logAPI.info('Network status checked', status);
    return status;
  } catch (error: any) {
    logAPI.error('Failed to check network status', error);
    return {
      isConnected: null,
      isInternetReachable: null,
      type: null,
    };
  }
}

export async function waitForConnection(timeout: number = 10000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const status = await checkNetworkStatus();
    if (status.isConnected && status.isInternetReachable) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}

export function getNetworkErrorMessage(status: NetworkStatus): string {
  if (status.isConnected === false) {
    return 'No network connection. Please check your WiFi or mobile data.';
  }
  if (status.isInternetReachable === false) {
    return 'Network connected but no internet access. Please check your connection.';
  }
  if (status.type === 'cellular' && !status.isInternetReachable) {
    return 'Mobile data connection issue. Try switching to WiFi.';
  }
  return 'Network error. Please check your internet connection.';
}
