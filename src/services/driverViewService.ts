// frontend-web/src/services/driverViewService.ts
import apiClient from './apiClient';

interface MapLocation {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
}

export interface DriverMapData {
    puulaanit: MapLocation[];
    purkupaikat: MapLocation[];
}

export const getDriverMapData = async (vehicleId: string): Promise<DriverMapData> => {
    try {
        const response = await apiClient.get<DriverMapData>('/driver/map-locations', {
            params: { vehicleId }
        });
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch driver map data", error);
        throw error;
    }
};

export const getActiveTripForDriver = async (): Promise<any | null> => {
    try {
        const response = await apiClient.get('/driver/active-trip');
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to fetch active trip for driver", error);
        throw error;
    }
};


export const updateTimberEntryStatus = async (puulaaniId: number, timberEntries: { puutavaraId: number, valmis: boolean }[]): Promise<any> => {
    try {
        const response = await apiClient.put(`/driver/puulaani/${puulaaniId}/statuses`, { timberEntries });
        return response.data;
    } catch (error) {
        console.error("SERVICE ERROR: Failed to update timber statuses", error);
        throw error;
    }
};
