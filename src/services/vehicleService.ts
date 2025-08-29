// frontend/src/services/vehicleService.ts

import apiClient from './apiClient';
import { IVehicle, ICreateVehicleDto, IUpdateVehicleDto, IVehicleBasicInfo, IVehicleBackendResponse } from '../types/vehicle';

const API_ENDPOINT = '/vehicles';

/**
 * Fetches all vehicles from the backend. Returns raw backend data.
 * @returns A promise that resolves to an array of IVehicleBackendResponse objects.
 */
export const fetchAllVehicles = async (): Promise<IVehicleBackendResponse[]> => {
    try {
        const response = await apiClient.get<IVehicleBackendResponse[]>(API_ENDPOINT);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch vehicles", error);
        throw error;
    }
};

/**
 * Fetches a list of vehicles for basic info (e.g., dropdowns).
 */
export const fetchVehiclesListApi = async (): Promise<IVehicleBasicInfo[]> => {
    // First, fetch raw backend data
    const allBackendVehicles: IVehicleBackendResponse[] = await fetchAllVehicles();
    // Then, transform it to IVehicleBasicInfo
    return allBackendVehicles.map(vehicle => ({
        id: String(vehicle.kalustoNro), // kalustoNro is now defined as number
        name: `${vehicle.kalustoNro} - ${vehicle.rekNro}`,
        vehicleNo: String(vehicle.kalustoNro),
        registrationNo: vehicle.rekNro,
    }));
};

/**
 * Fetches a single vehicle by its ID.
 * @param id - The string ID of the vehicle.
 */
export const fetchVehicleById = async (id: string): Promise<IVehicle> => {
  try {
    const response = await apiClient.get<IVehicleBackendResponse>(`${API_ENDPOINT}/${id}`);
    // Transform the single backend response to frontend IVehicle format
    const backendVehicle = response.data;
    return {
        vehicleNo: String(backendVehicle.kalustoNro),
        registrationNo: backendVehicle.rekNro,
        previousInspectionDate: new Date(backendVehicle.edKatsastus).toISOString().split('T')[0],
        nextInspectionDate: new Date(backendVehicle.katsastusAik).toISOString().split('T')[0],
        isActive: backendVehicle.aktiivinen,
    };
  } catch (error) {
    console.error(`SERVICE ERROR: API call failed for fetchVehicleById (${id}):`, error);
    throw error;
  }
};

/**
 * Sends a request to create a new vehicle.
 */
export const createVehicle = async (vehicleData: ICreateVehicleDto): Promise<IVehicle> => {
  try {
    const response = await apiClient.post<IVehicleBackendResponse>(API_ENDPOINT, vehicleData);
    const backendVehicle = response.data;
    return {
        vehicleNo: String(backendVehicle.kalustoNro),
        registrationNo: backendVehicle.rekNro,
        previousInspectionDate: new Date(backendVehicle.edKatsastus).toISOString().split('T')[0],
        nextInspectionDate: new Date(backendVehicle.katsastusAik).toISOString().split('T')[0],
        isActive: backendVehicle.aktiivinen,
    };
  } catch (error) {
    console.error('SERVICE ERROR: API call failed for createVehicle:', error);
    throw error;
  }
};

/**
 * Sends a request to update an existing vehicle.
 * @param id - The string ID of the vehicle to update.
 */
export const updateVehicle = async (id: string, vehicleData: IUpdateVehicleDto): Promise<IVehicle> => {
  try {
    const response = await apiClient.put<IVehicleBackendResponse>(`${API_ENDPOINT}/${id}`, vehicleData);
    const backendVehicle = response.data;
    return {
        vehicleNo: String(backendVehicle.kalustoNro),
        registrationNo: backendVehicle.rekNro,
        previousInspectionDate: new Date(backendVehicle.edKatsastus).toISOString().split('T')[0],
        nextInspectionDate: new Date(backendVehicle.katsastusAik).toISOString().split('T')[0],
        isActive: backendVehicle.aktiivinen,
    };
  } catch (error) {
    console.error(`SERVICE ERROR: API call failed for updateVehicle (${id}):`, error);
    throw error;
  }
};

/**
 * Sends a request to delete a vehicle by its ID.
 * @param id - The string ID of the vehicle to delete.
 */
export const deleteVehicle = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${API_ENDPOINT}/${id}`);
  } catch (error) {    
    console.error(`SERVICE ERROR: API call failed for deleteVehicle (${id}):`, error);
    throw error;
  }
};

/**
 * Checks if a registration number already exists.
 * @param registrationNo - The registration number to check.
 * @param VehicleId - (Optional) The string ID of the current vehicle to exclude.
 */
export const checkRegistrationNoExists = async (registrationNo: string, vehicleId?: string): Promise<boolean> => {
  if (!registrationNo || registrationNo.trim() === '') {
    return false; // Not unique if empty
  }
  
  try {
    const response = await apiClient.get<{ exists: boolean }>(`${API_ENDPOINT}/check-reg-no`, {
      params: {
        registrationNo,
        // --- KEY CORRECTION: Pass undefined instead of null ---
        // Axios will omit undefined parameters from the request URL, which is cleaner.
        VehicleId: vehicleId, 
      },
    });
    return response.data.exists;
  } catch (error) {
    console.error("SERVICE ERROR: Failed to check registration number:", error);
    // If the API call fails, assume it's unique to prevent blocking (or re-throw for global handling)
    throw error; 
  }
};