// frontend/src/hooks/useMapData.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    IMapFilterState, IMapTimberStack, IMapDropoffLocation, IMapOtherMarker,
    IClientBasicInfo, IVehicleBasicInfo, IBackendPuulaani, IBackendPurkupaikkaResponse,
    IBackendOtherMarker, IMapTrip
} from '../types';
import { fetchAllTimberStacks } from '../services/timberStackService';
import { fetchAllDropoffLocations } from '../services/unloadingSiteService';
import { fetchAllOtherMarkers } from '../services/otherInfoService';
import { fetchClientsListApi } from '../services/clientService';
import { fetchVehiclesListApi } from '../services/vehicleService';
import { fetchActiveTripsForMap } from '../services/loadService';
import { chipTitleService } from '@/services/chipTitleService';

// Define the shape of the data state object
interface IDataState {
    timberStacks: IMapTimberStack[];
    dropoffLocations: IMapDropoffLocation[];
    otherMarkers: IMapOtherMarker[];
    activeTrips: IMapTrip[];
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

    const [data, setData] = useState<IDataState>({
        timberStacks: [],
        dropoffLocations: [],
        otherMarkers: [],
        activeTrips: [],
    });

    const [clientList, setClientList] = useState<IClientBasicInfo[]>([]);
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setMapError(null);
        try {
            // 🚀 2. Fetch chip titles alongside other data
            const [stackData, clientData, vehicleData, dropoffData, otherMarkerData, tripData, chipTitles] = await Promise.all([
                fetchAllTimberStacks(filters),
                fetchClientsListApi(),
                fetchVehiclesListApi(),
                fetchAllDropoffLocations(),
                fetchAllOtherMarkers(),
                fetchActiveTripsForMap(),
                chipTitleService.getAll()
            ]);

            const chipLoadingPointIds = new Set(chipTitles.map((t: any) => Number(t.loadingPointId || t.loading_point_id)));
            const chipUnloadingPointIds = new Set(chipTitles.map((t: any) => Number(t.unloadingPointId || t.unloading_point_id)));

            setClientList(clientData);
            setVehicleList(vehicleData);

            // 🚀 3. Filter out timber stacks that are actually Chip Loading points
            const transformedStacks = stackData
                .filter((s: IBackendPuulaani) => {
                    const isChip = chipLoadingPointIds.has(Number(s.puulaaniId));
                    return !isChip;
                })
                .map((s: IBackendPuulaani): IMapTimberStack => ({
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

            // 🚀 4. Add isChipDestination flag to dropoff locations
            const transformedDropoffs = dropoffData.map((d: IBackendPurkupaikkaResponse): IMapDropoffLocation => ({
                id: d.purkupaikkaId,
                clientId: d.asiakasId,
                clientName: d.clientName || 'N/A',
                name: d.purkupaikka,
                latitude: d.sijaintiLat!,
                longitude: d.sijaintiLong!,
                isVisibleOnMap: d.isVisibleOnMap,
                isChipDestination: chipUnloadingPointIds.has(Number(d.purkupaikkaId))
            }));

            const transformedOtherMarkers = otherMarkerData.map((o: IBackendOtherMarker): IMapOtherMarker => ({
                id: o.muutietoId, name: o.nimi, iconType: o.tyyppi, color: o.vari,
                additionalInfo: o.lisatieto, latitude: o.sijaintiLat!, longitude: o.sijaintiLong!,
            }));

            setData({
                timberStacks: transformedStacks,
                dropoffLocations: transformedDropoffs,
                otherMarkers: transformedOtherMarkers,
                activeTrips: tripData,

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