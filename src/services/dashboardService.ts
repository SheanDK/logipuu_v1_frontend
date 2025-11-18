
// src/services/dashboardService.ts
import apiClient from './apiClient';
import { 
    IAdminDashboardStats, 
    IDispatchDashboardStats, 
    IDriverDashboardStats, 
    IVolumeByDay, 
    IActiveTripListItem 
} from '../types';

const API_ENDPOINT = '/dashboard';

export const getAdminDashboardStats = async (): Promise<IAdminDashboardStats> => {
    try {
        const response = await apiClient.get<IAdminDashboardStats>(`${API_ENDPOINT}/admin`);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch admin dashboard stats", error);
        throw error;
    }
};

// --- NEW: Dispatcher stats සඳහා function එක ---
export const getDispatchDashboardStats = async (): Promise<IDispatchDashboardStats> => {
    try {
        const response = await apiClient.get<IDispatchDashboardStats>(`${API_ENDPOINT}/dispatch`);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch dispatch dashboard stats", error);
        throw error;
    }
};

// --- NEW: Driver stats සඳහා function එක ---
export const getDriverDashboardStats = async (): Promise<IDriverDashboardStats> => {
    try {
        const response = await apiClient.get<IDriverDashboardStats>(`${API_ENDPOINT}/driver`);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch driver dashboard stats", error);
        throw error;
    }
};

export const getVolumeLast7Days = async (): Promise<IVolumeByDay[]> => {
    try {
        const response = await apiClient.get<IVolumeByDay[]>(`${API_ENDPOINT}/volume-by-day`);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch volume data", error);
        throw error;
    }
};

export const getActiveTripsList = async (): Promise<IActiveTripListItem[]> => {
    try {
        const response = await apiClient.get<IActiveTripListItem[]>(`${API_ENDPOINT}/active-trips`);
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch active trips list", error);
        throw error;
    }
};