// frontend/src/services/loadService.ts
import apiClient from './apiClient';
import { 
    ILoadListItem, 
    ICreateLoadDto, 
    ILoad,
    // --- STEP 1: Import the new type ---
    IUpdateLoadDto 
} from '../types';
import { ILoadFilters } from '@/components/loads/LoadFilterBar';

const API_ENDPOINT = '/loads';

export const fetchAllLoads = async (filters: ILoadFilters): Promise<ILoadListItem[]> => {
    try {
        // The filters object will be automatically converted to query parameters by axios
        const response = await apiClient.get<ILoadListItem[]>(API_ENDPOINT, { params: filters });
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch all loads", error);
        throw error;
    }
};

// This function is needed for the Edit functionality
export const getLoadById = async (id: number): Promise<ILoad> => {
    try {
        const response = await apiClient.get<ILoad>(`${API_ENDPOINT}/${id}`);
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

// --- STEP 2: Add the new updateLoad function ---
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


// --- THIS IS THE FUNCTION FOR THE DRIVER'S PORTAL ---
export const fetchMyLoads = async (): Promise<ILoadListItem[]> => {
    try {
        const response = await apiClient.get<ILoadListItem[]>(`${API_ENDPOINT}/my-loads`);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch my loads", error);
        throw error;
    }
};