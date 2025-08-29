// frontend/src/services/timberStackService.ts

import apiClient from './apiClient';
import { 
    IBackendPuulaani, 
    ICreateTimberStackDto, 
    IUpdateTimberStackDto, 
    IUpdateTimberStackFullDto, 
    IPuulaaniFullDetails,
    IPuutavaraItem,
    IMapFilterState, // Use IMapFilterState for filtering
    ITimberStackListFilters,
    ITimberStackListItem,
    IWoodEntry,
} from '../types';

const API_ENDPOINT = '/timber-stacks';
const WOOD_TYPES_ENDPOINT = '/wood-types'; // Assuming this is the correct endpoint

// --- Timber Stack CRUD Operations ---

export const fetchAllTimberStacks = async (filters: IMapFilterState): Promise<IBackendPuulaani[]> => {
    try {
        // --- CORRECTION: Clean the filter object before sending ---
        const params: Partial<IMapFilterState> = {};

        if (filters.status) {
            params.status = filters.status;
        }
        if (filters.clientId) { // Only add if clientId is not null/undefined
            params.clientId = filters.clientId;
        }
        if (filters.vehicleId) { // Only add if vehicleId is not null/undefined
            params.vehicleId = filters.vehicleId;
        }
        // Now 'params' object only contains properties with actual values.

        const response = await apiClient.get<IBackendPuulaani[]>(API_ENDPOINT, { params }); // Pass the cleaned params
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch all timber stacks", error);
        throw error;
    }
};


export const createTimberStack = async (data: ICreateTimberStackDto): Promise<IBackendPuulaani> => {
    try {
        const response = await apiClient.post<IBackendPuulaani>(API_ENDPOINT, data);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to create timber stack", error);
        throw error;
    }
};

export const updateTimberStack = async (id: number, data: IUpdateTimberStackDto): Promise<IBackendPuulaani> => {
    try {
        const response = await apiClient.put<IBackendPuulaani>(`${API_ENDPOINT}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to update timber stack ${id}`, error);
        throw error;
    }
};

export const deleteTimberStack = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`${API_ENDPOINT}/${id}`);
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to delete timber stack ${id}`, error);
        throw error;
    }
};


// --- Functions for Full Details (from former mapService) ---

export const fetchTimberStackFullDetails = async (id: number): Promise<IPuulaaniFullDetails> => {
    try {
        const response = await apiClient.get<IPuulaaniFullDetails>(`${API_ENDPOINT}/${id}/full`);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to fetch full details for timber stack ID ${id}`, error);
        throw error;
    }
};

export const updateTimberStackFull = async (id: number, data: IUpdateTimberStackFullDto): Promise<void> => {
    try {
        await apiClient.put(`${API_ENDPOINT}/${id}/full`, data);
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to update full details for timber stack ID ${id}`, error);
        throw error;
    }
};

// --- Function for Wood Types (from former puutavaraService) ---

export const fetchAllWoodTypes = async (): Promise<IPuutavaraItem[]> => {
    try {
        // Assuming the wood types endpoint returns an array of IPuutavaraItem
        const response = await apiClient.get<IPuutavaraItem[]>(WOOD_TYPES_ENDPOINT);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch wood types", error);
        throw error;
    }
};

export const updateTimberStackLocation = async (id: number, location: { latitude: number, longitude: number }): Promise<any> => {
    try {
        const response = await apiClient.patch(`${API_ENDPOINT}/${id}/location`, location);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to update location for timber stack ${id}`, error);
        throw error;
    }
};

// --- THIS IS THE NEW FUNCTION FOR THE PUULAANI LIST VIEW ---
export const fetchTimberStackList = async (filters: ITimberStackListFilters): Promise<ITimberStackListItem[]> => {
    try {
        const params = new URLSearchParams();

        if (filters.status && filters.status !== 'all') {
            params.append('status', filters.status);
        }
        if (filters.clientId) {
            params.append('clientId', filters.clientId);
        }
        if (filters.vehicleId) {
            params.append('vehicleId', filters.vehicleId);
        }
        if (filters.timberTypeId) {
            params.append('timberTypeId', filters.timberTypeId);
        }

        // --- THIS IS THE FIX ---
        // Use the correct '/list' endpoint that we created in the backend.
        const response = await apiClient.get<ITimberStackListItem[]>(`/timber-stacks/list?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch timber stack list", error);
        throw error;
    }
};

export const getActiveTimberStacksByClient = async (clientId: number): Promise<ITimberStackListItem[]> => {
    try {
        const response = await apiClient.get<ITimberStackListItem[]>(`/timber-stacks/active/by-client/${clientId}`);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to fetch active timber stacks for client ${clientId}`, error);
        throw error;
    }
};

export const fetchWoodEntriesByPuulaani = async (puulaaniId: number): Promise<IWoodEntry[]> => {
    try {
        const response = await apiClient.get<IWoodEntry[]>(`${API_ENDPOINT}/${puulaaniId}/wood-entries`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch wood entries for puulaani ${puulaaniId}`, error);
        throw error;
    }
};