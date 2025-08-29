// frontend/src/services/drivenInspectionService.ts
'use client'; 

import apiClient from './apiClient';
import { IDrivenInspectionListItem, IDrivenInspectionFilters, IUpdateDrivenInspectionRowDto, ICreateKuormaFromPtlDto } from '@/types';
import dayjs from 'dayjs';

const API_ENDPOINT = '/driven-inspection';

// --- NEW: Define the response type for the accept call for clarity ---
interface IAcceptEntriesResponse {
    message: string;
    approvedCount: number;
}


// ... fetchDrivenInspectionList and updateDrivenInspectionRow remain the same ...
export const fetchDrivenInspectionList = async (filters: Partial<IDrivenInspectionFilters>): Promise<IDrivenInspectionListItem[]> => {
    try {
        const params = {
            ...filters,
            startDate: filters.startDate ? dayjs(filters.startDate).format('YYYY-MM-DD') : undefined,
            endDate: filters.endDate ? dayjs(filters.endDate).format('YYYY-MM-DD') : undefined,
        };
        const response = await apiClient.get<IDrivenInspectionListItem[]>(`${API_ENDPOINT}/list`, { 
            params: params 
        });
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch driven/inspection list", error);
        throw error;
    }
};

export const updateDrivenInspectionRow = async (id: number, data: Partial<IUpdateDrivenInspectionRowDto>) => {
    try {
        // The endpoint uses the ID of the resource being updated, which is now 'kuorma'
        const response = await apiClient.put(`${API_ENDPOINT}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to update entry ${id}`, error);
        throw error;
    }
};


export const acceptDrivenInspectionEntries = async (puutavaraIds: number[]): Promise<IAcceptEntriesResponse> => {
    // --- THIS IS THE FIX ---
    // Add the generic type <IAcceptEntriesResponse> to the post call.
    const response = await apiClient.post<IAcceptEntriesResponse>(`${API_ENDPOINT}/accept`, { puutavaraIds });
    return response.data; // Now response.data is correctly typed
};

// ... deleteDrivenInspectionEntry remains the same ...
export const deleteDrivenInspectionEntry = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`${API_ENDPOINT}/${id}`);
    } catch (error) {
        console.error(`SERVICE ERROR: Failed to delete entry ${id}`, error);
        throw error;
    }
};

export const createDrivenInspectionEntry = async (data: ICreateKuormaFromPtlDto) => {
    try {
        const response = await apiClient.post(API_ENDPOINT, data);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to create new entry", error);
        throw error;
    }
};