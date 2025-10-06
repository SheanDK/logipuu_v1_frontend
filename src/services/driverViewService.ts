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

