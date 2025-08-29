// frontend/src/services/otherInfoService.ts
import apiClient from './apiClient';
import { 
    IBackendMuuMerkki, 
    ICreateOtherMarkerDto, 
    IUpdateOtherMarkerDto 
} from '../types';

// --- CORRECTION IS HERE ---
const API_ENDPOINT = '/other-markers'; // <<< CORRECT ENDPOINT
// --- END CORRECTION ---

export const fetchAllOtherMarkers = async (): Promise<IBackendMuuMerkki[]> => {
    try {
        const response = await apiClient.get<IBackendMuuMerkki[]>(API_ENDPOINT);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch other markers", error);
        throw error;
    }
};

export const createOtherMarker = async (data: ICreateOtherMarkerDto): Promise<IBackendMuuMerkki> => {
    try {
        const response = await apiClient.post<IBackendMuuMerkki>(API_ENDPOINT, data);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to create other marker", error);
        throw error;
    }
};

export const updateOtherMarker = async (id: number, data: IUpdateOtherMarkerDto): Promise<IBackendMuuMerkki> => {
    try {
        const response = await apiClient.put<IBackendMuuMerkki>(`${API_ENDPOINT}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to update other marker ${id}`, error);
        throw error;
    }
};

export const deleteOtherMarker = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`${API_ENDPOINT}/${id}`);
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to delete other marker ${id}`, error);
        throw error;
    }
};