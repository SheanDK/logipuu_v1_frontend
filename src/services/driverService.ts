// frontend/src/services/driverService.ts

import apiClient from './apiClient';
import { IDriver, ICreateDriverDto, IUpdateDriverDto, IDriverBasicInfo, IBackendDriver } from '../types';

const API_ENDPOINT = '/drivers';

/**
 * Fetches all drivers from the backend. Returns raw backend data.
 * @returns A promise that resolves to an array of IBackendDriver objects.
 */
export const fetchAllDrivers = async (): Promise<IBackendDriver[]> => {
  try {
    const response = await apiClient.get<IBackendDriver[]>(API_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error("SERVICE ERROR: Failed to fetch all drivers", error);
    throw error;
  }
};

/**
 * Fetches a single driver by ID.
 * @param driverId - The ID of the driver.
 */
export const fetchDriverById = async (driverId: number): Promise<IDriver> => {
  try {
    const response = await apiClient.get<IDriver>(`${API_ENDPOINT}/${driverId}`);
    return response.data;
  } catch (error) {
    console.error(`SERVICE ERROR: API call failed for fetchDriverById (${driverId}):`, error);
    throw error;
  }
};

/**
 * Creates a new driver.
 */
export const createDriver = async (driverData: ICreateDriverDto): Promise<IDriver> => {
  try {
    const response = await apiClient.post<IDriver>(API_ENDPOINT, driverData);
    return response.data;
  } catch (error) {
    console.error('SERVICE ERROR: API call failed for createDriver:', error);
    throw error;
  }
};

/**
 * Updates an existing driver.
 */
export const updateDriver = async (driverId: number, driverData: IUpdateDriverDto): Promise<IDriver> => {
  try {
    const response = await apiClient.put<IDriver>(`${API_ENDPOINT}/${driverId}`, driverData);
    return response.data;
  } catch (error) {
    console.error(`SERVICE ERROR: API call failed for updateDriver (${driverId}):`, error);
    throw error;
  }
};

/**
 * Deletes a driver.
 */
export const deleteDriver = async (driverId: number): Promise<void> => {
  try {
    await apiClient.delete(`${API_ENDPOINT}/${driverId}`);
  } catch (error) {
    console.error(`SERVICE ERROR: API call failed for deleteDriver (${driverId}):`, error);
    throw error;
  }
};

/**
 * Fetches a list of drivers for basic info (e.g., dropdowns).
 */
export const fetchDriversListApi = async (): Promise<IDriverBasicInfo[]> => {
  // This now fetches raw backend data first, then transforms it.
  const allBackendDrivers: IBackendDriver[] = await fetchAllDrivers();
  return allBackendDrivers.map(driver => ({
    id: driver.kuljId, // Map kuljId to id
    name: driver.nimi, // Map nimi to name
    driverId: driver.kuljId, // Map kuljId to driverId
    driverName: driver.nimi, // Map nimi to driverName
  }));
};

/**
 * get the drivers without account 
 */
export const fetchDriversWithoutAccountApi = async (): Promise<IDriverBasicInfo[]> => {
  try {
    const response = await apiClient.get<any[]>('/drivers/no-account');

    if (!Array.isArray(response.data)) return [];

    return response.data.map(d => {
      const nameValue = d.nimi || d.name || d.driverName || d.driver_name || 'Unknown Name';
      const idValue = d.kuljId || d.kulj_id || d.id;

      return {
        id: Number(idValue),
        name: nameValue,
        driverId: Number(idValue),
        driverName: nameValue
      };
    });
  } catch (error) {
    console.error("SERVICE ERROR: Failed to fetch drivers without account", error);
    return [];
  }
};