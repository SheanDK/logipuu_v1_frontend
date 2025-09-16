// frontend/src/hooks/useMapData.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    IMapFilterState, IMapTimberStack, IMapDropoffLocation, IMapOtherMarker,
    IClientBasicInfo, IVehicleBasicInfo, IBackendPuulaani, IBackendPurkupaikkaResponse, 
    IBackendOtherMarker, IMapTrip // Import the new IMapTrip type
} from '../types';
import { fetchAllTimberStacks } from '../services/timberStackService';
import { fetchAllDropoffLocations } from '../services/unloadingSiteService';
import { fetchAllOtherMarkers } from '../services/otherInfoService';
import { fetchClientsListApi } from '../services/clientService';
import { fetchVehiclesListApi } from '../services/vehicleService';
import { fetchActiveTripsForMap } from '../services/loadService'; // Import the new service function

// Define the shape of the data state object
interface IDataState {
    timberStacks: IMapTimberStack[];
    dropoffLocations: IMapDropoffLocation[];
    otherMarkers: IMapOtherMarker[];
    activeTrips: IMapTrip[]; // Add activeTrips to the state
}

interface MapDataResult {
    isLoading: boolean;
    mapError: string | null;
    data: IDataState;
    lists: {
        clientList: IClientBasicInfo[];
        vehicleList: IVehicleBasicInfo[];
    };
    reloadData: () => void;
    setLocalData: (partialData: Partial<IDataState>) => void;
}

export const useMapData = (filters: IMapFilterState): MapDataResult => {
    const [isLoading, setIsLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);
    
    // Use a single state object for all map data
    const [data, setData] = useState<IDataState>({
        timberStacks: [],
        dropoffLocations: [],
        otherMarkers: [],
        activeTrips: [], // Initialize activeTrips as an empty array
    });
    
    const [clientList, setClientList] = useState<IClientBasicInfo[]>([]);
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setMapError(null);
        try {
            // --- THIS IS THE FIX (PART 1) ---
            // Add the new fetchActiveTripsForMap call to Promise.all
            const [stackData, clientData, vehicleData, dropoffData, otherMarkerData, tripData] = await Promise.all([
                fetchAllTimberStacks(filters),
                fetchClientsListApi(),
                fetchVehiclesListApi(),
                fetchAllDropoffLocations(),
                fetchAllOtherMarkers(),
                fetchActiveTripsForMap(), // Fetch active trips
            ]);
            
            setClientList(clientData);
            setVehicleList(vehicleData);

            const transformedStacks = stackData.map((s: IBackendPuulaani): IMapTimberStack => ({
                id: s.puulaaniId,
                clientId: s.asiakasId,
                name: s.nimi,
                clientName: s.asiakkaanNimi || 'Unknown',
                clientColor: s.kohteenVari || null,
                latitude: s.sijaintiLat!,
                longitude: s.sijaintiLong!,
                totalVolume: Number(s.kok) || 0,
                remainingVolume: Number(s.jaljella) || 0,
                isActive: s.aktiivinen,
                isCompleted: s.valmis,
                date: s.pvm,
                dispatchOrderNo: s.ajomaaraysnro,
                additionalInfo: s.lisatiedot
            }));
            
            const transformedDropoffs = dropoffData.map((d: IBackendPurkupaikkaResponse): IMapDropoffLocation => ({
                id: d.purkupaikkaId,
                clientId: d.asiakasId,
                clientName: d.clientName || 'N/A',
                name: d.purkupaikka,
                latitude: d.sijaintiLat!,
                longitude: d.sijaintiLong!,
                isVisibleOnMap: d.isVisibleOnMap,
            }));
            
            const transformedOtherMarkers = otherMarkerData.map((o: IBackendOtherMarker): IMapOtherMarker => ({
                id: o.muutietoId, name: o.nimi, iconType: o.tyyppi, color: o.vari,
                additionalInfo: o.lisatieto, latitude: o.sijaintiLat!, longitude: o.sijaintiLong!,
            }));

            // Set the entire data object at once
             setData({
                timberStacks: transformedStacks,
                dropoffLocations: transformedDropoffs,
                otherMarkers: transformedOtherMarkers,
                activeTrips: tripData, // Add the fetched trip data to the state
            });

        } catch (err: any) {
            setMapError(err.response?.data?.message || "Failed to load map data.");
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const setLocalData = (partialData: Partial<IDataState>) => {
        setData(prevData => ({ ...prevData, ...partialData }));
    };

    return {
        isLoading,
        mapError,
        data,
        lists: { clientList, vehicleList },
        reloadData: fetchData,
        setLocalData,
    };
};