// frontend/src/services/loadService.ts
import apiClient from './apiClient';
import { 
    ILoadListItem, 
    ICreateLoadDto, 
    ILoad,
    IUpdateLoadDto, 
    ILoadStatusUpdateDto,
    ILoadDetails,
    // --- STEP 1: Import the new type ---
    ICompleteLoadDto,
    IMapTrip, 
} from '../types';

const API_ENDPOINT = '/loads';

export interface ILoadListApiFilters {
    status?: 'active' | 'all';
    asiakasId?: string;
    kalustoNro?: string;
    kuljId?: string;
}

// Update the function to use the new, more specific type for its parameter.
export const fetchAllLoads = async (filters: ILoadListApiFilters): Promise<ILoadListItem[]> => {
    try {
        const response = await apiClient.get<ILoadListItem[]>(API_ENDPOINT, { params: filters });
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch all loads", error);
        throw error;
    }
};


export const getLoadById = async (id: number): Promise<ILoadDetails> => {
    try {
        const response = await apiClient.get<ILoadDetails>(`${API_ENDPOINT}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to fetch load with ID ${id}`, error);
        throw error;
    }
};

export const createLoad = async (data: ICreateLoadDto): Promise<ILoad> => {
    try {
        const response = await apiClient.post<ILoad>(API_ENDPOINT, data);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to create load", error);
        throw error;
    }
};

export const updateLoad = async (id: number, data: IUpdateLoadDto): Promise<ILoad> => {
    try {
        const response = await apiClient.put<ILoad>(`${API_ENDPOINT}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to update load with ID ${id}`, error);
        throw error;
    }
};

export const deleteLoad = async (id: number): Promise<any> => {
    try {
        const response = await apiClient.delete(`${API_ENDPOINT}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to delete load with ID ${id}`, error);
        throw error;
    }
};

export const fetchMyLoads = async (): Promise<ILoadListItem[]> => {
    try {
        const response = await apiClient.get<ILoadListItem[]>(`${API_ENDPOINT}/my-loads`);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch my loads", error);
        throw error;
    }
};

export const updateLoadStatus = async (id: number, data: ILoadStatusUpdateDto): Promise<ILoad> => {
    try {
        const response = await apiClient.patch<ILoad>(`${API_ENDPOINT}/${id}/status`, data);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to update status for load ${id}`, error);
        throw error;
    }
};

// --- STEP 2: Add the new completeLoad function ---
export const completeLoad = async (id: number, data: ICompleteLoadDto): Promise<ILoad> => {
    try {
        const response = await apiClient.patch<ILoad>(`${API_ENDPOINT}/${id}/complete`, data);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to complete load ${id}`, error);
        throw error;
    }
};

export const fetchLoadsForInspection = async (): Promise<ILoadListItem[]> => {
    try {
        const response = await apiClient.get<ILoadListItem[]>('/loads/for-inspection');
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch loads for inspection", error);
        throw error;
    }
};

export const acceptLoadsForInvoicing = async (loadIds: (string | number)[]): Promise<{ count: number }> => {
    try {
        const response = await apiClient.post<{ count: number }>('/loads/accept-for-invoicing', { loadIds });
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to accept loads for invoicing", error);
        throw error;
    }
};

export const fetchMyCompletedLoads = async (): Promise<ILoadListItem[]> => {
    try {
        const response = await apiClient.get<ILoadListItem[]>('/loads/my-loads/completed');
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch driver's completed loads", error);
        throw error;
    }
}; 

export const fetchMyLastCompletedLoad = async (): Promise<ILoadListItem | null> => {
    try {
        const response = await apiClient.get<ILoadListItem | null>('/loads/my-loads/last-completed');
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch driver's last completed load", error);
        throw error;
    }
};

export const fetchActiveTripsForMap = async (): Promise<IMapTrip[]> => {
    try {
        const response = await apiClient.get<IMapTrip[]>('/loads/active-trips');
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch active trips for map", error);
        throw error;
    }
};