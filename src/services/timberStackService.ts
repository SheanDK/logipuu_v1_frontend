// frontend/src/services/timberStackService.ts
import apiClient from './apiClient';
import camelcaseKeys from 'camelcase-keys';
import {
    IBackendPuulaani,
    ICreateTimberStackDto,
    IUpdateTimberStackDto,
    IUpdateTimberStackFullDto,
    IPuulaaniFullDetails,
    IPuutavaraItem,
    IMapFilterState,
    ITimberStackListFilters,
    ITimberStackListItem,
    IWoodEntry,
} from '../types';
import { PuulaaniDetails } from '@/types';

const API_ENDPOINT = '/timber-stacks';
const WOOD_TYPES_ENDPOINT = '/wood-types';


export const fetchAllTimberStacks = async (filters: IMapFilterState): Promise<IBackendPuulaani[]> => {
    try {
        // --- THE DEFINITIVE FIX ---
        // 1. Create a brand new, completely empty, and mutable object.
        const apiParams: { [key: string]: any } = {};

        // 2. Conditionally copy ONLY the properties that have a value from the
        //    read-only 'filters' object. This breaks any connection to the original object.
        if (filters.status) {
            apiParams.status = filters.status;
        }
        if (filters.clientId) {
            apiParams.clientId = filters.clientId;
        }
        if (filters.vehicleId) {
            apiParams.vehicleId = filters.vehicleId;
        }

        // 3. Pass this new, clean, and mutable object to the axios config.
        const response = await apiClient.get<IBackendPuulaani[]>(API_ENDPOINT, { params: apiParams });
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

export const fetchAllWoodTypes = async (): Promise<IPuutavaraItem[]> => {
    try {
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

export const fetchTimberStackList = async (filters: ITimberStackListFilters): Promise<ITimberStackListItem[]> => {
    try {
        const params: Record<string, string> = {};

        if (filters.status && filters.status !== 'all') {
            params.status = filters.status;
        }

        if (filters.clientId) {
            params.clientId = filters.clientId;
        }

        if (filters.vehicleId) {
            params.vehicleId = filters.vehicleId;
        }

        if (filters.timberTypeId) {
            params.timberTypeId = filters.timberTypeId;
        }

        const response = await apiClient.get<ITimberStackListItem[]>(API_ENDPOINT, { params });
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
        const response = await apiClient.get<any[]>(`${API_ENDPOINT}/${puulaaniId}/wood-entries`);
        const camelCasedData = camelcaseKeys(response.data, { deep: true });
        return camelCasedData as IWoodEntry[];
    } catch (error) {
        console.error(`Failed to fetch wood entries for puulaani ${puulaaniId}`, error);
        throw error;
    }
};

export const getTimberStackFullDetails = async (id: number): Promise<PuulaaniDetails> => {
    try {
        const response = await apiClient.get<PuulaaniDetails>(`${API_ENDPOINT}/${id}/full`);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to fetch full details for timber stack ${id}`, error);
        throw error;
    }
};
