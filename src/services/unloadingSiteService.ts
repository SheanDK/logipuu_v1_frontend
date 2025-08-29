// frontend/src/services/unloadingSiteService.ts
import apiClient from './apiClient';
import { 
    IBackendPurkupaikkaResponse, // <<< Use the new, accurate response type
    ICreatePurkupaikkaDto, 
    IUpdatePurkupaikkaDto 
} from '../types';

const API_ENDPOINT = '/unloading-sites';

export const fetchAllDropoffLocations = async (): Promise<IBackendPurkupaikkaResponse[]> => {
    try {
        const response = await apiClient.get<IBackendPurkupaikkaResponse[]>(API_ENDPOINT);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch drop-off locations", error);
        throw error;
    }
};

export const createDropoffLocation = async (data: ICreatePurkupaikkaDto): Promise<IBackendPurkupaikkaResponse> => {
    try {
        const response = await apiClient.post<IBackendPurkupaikkaResponse>(API_ENDPOINT, data);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to create drop-off location", error);
        throw error;
    }
};

export const updateDropoffLocation = async (id: number, data: IUpdatePurkupaikkaDto): Promise<IBackendPurkupaikkaResponse> => {
    try {
        const response = await apiClient.put<IBackendPurkupaikkaResponse>(`${API_ENDPOINT}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to update drop-off location ${id}`, error);
        throw error;
    }
};

export const deleteDropoffLocation = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`${API_ENDPOINT}/${id}`);
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to delete drop-off location ${id}`, error);
        throw error;
    }
};

export const fetchUnloadingSitesByClientId = async (clientId: number): Promise<IBackendPurkupaikkaResponse[]> => {
    try {
        const response = await apiClient.get<IBackendPurkupaikkaResponse[]>(`${API_ENDPOINT}/by-client/${clientId}`);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to fetch unloading sites for client ${clientId}`, error);
        throw error;
    }
};

export const updateUnloadingSiteVisibility = async (id: number, isVisible: boolean): Promise<IBackendPurkupaikkaResponse> => {
    try {
        const response = await apiClient.patch<IBackendPurkupaikkaResponse>(`${API_ENDPOINT}/${id}/visibility`, { isVisible });
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to update visibility for site ${id}`, error);
        throw error;
    }
};