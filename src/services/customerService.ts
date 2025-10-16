// frontend/src/services/customerService.ts
import apiClient from './apiClient';

// A simple interface for the customer dropdown
export interface ICustomerOption {
    asiakkaanId: number;
    asiakkaanNimi: string;
}

/**
 * Fetches a list of customers for dropdowns.
 * Corresponds to: GET /api/clients (assuming this endpoint exists and returns a list)
 */
export const getCustomerOptions = async (): Promise<ICustomerOption[]> => {
    try {
        // Assuming '/clients' is the endpoint that returns all clients
        const response = await apiClient.get<ICustomerOption[]>('/clients');
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch customers", error);
        throw error;
    }
};