// frontend/src/services/consignmentDriverService.ts
import apiClient from './apiClient'; // FIX: Using the project's standard apiClient
import { IConsignmentKuormaListItem, IConsignmentForm } from '@/types';

// Define the specific API endpoint for driver consignments
const API_ENDPOINT = '/driver/consignments';

/**
 * Fetches the list of parent consignment loads for the dashboard.
 * Corresponds to: GET /api/driver/consignments
 */
export const getDriverConsignments = async (vehicleId: string): Promise<IConsignmentKuormaListItem[]> => {
    try {
        const response = await apiClient.get<IConsignmentKuormaListItem[]>(API_ENDPOINT, {
            params: { vehicleId } 
        });
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch driver consignments", error);
        throw error;
    }
};

/**
 * Fetches the full details of a single consignment for editing.
 * Corresponds to: GET /api/driver/consignments/:id
 */
export const getConsignmentById = async (id: number): Promise<IConsignmentForm> => {
    try {
        const response = await apiClient.get<IConsignmentForm>(`${API_ENDPOINT}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to fetch consignment with ID ${id}`, error);
        throw error;
    }
};

/**
 * Creates a new consignment (parent + children).
 * Corresponds to: POST /api/driver/consignments
 */
export const createConsignment = async (payload: IConsignmentForm): Promise<any> => {
    try {
        const response = await apiClient.post(API_ENDPOINT, payload);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to create consignment", error);
        throw error;
    }
};

/**
 * Updates an existing consignment.
 * Corresponds to: PUT /api/driver/consignments/:id
 */
export const updateConsignment = async (id: number, payload: IConsignmentForm): Promise<any> => {
    try {
        const response = await apiClient.put(`${API_ENDPOINT}/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to update consignment with ID ${id}`, error);
        throw error;
    }
};

