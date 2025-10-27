'use client';

import { PropsWithChildren, useEffect } from 'react';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { getDriverMapData } from '@/services/driverViewService';
import { getTimberStackFullDetails } from '@/services/timberStackService';
import { saveDriverMapData, listCachedPuulaanit, savePuulaaniDetails } from '@/offline/driverCache';
import { useRef } from 'react';

/**
 * Placeholder bootstrap component. In the next steps we will extend this to
 * pull all driver resources online and seed the offline cache.
 */
export default function DriverOfflineBootstrap({ children }: PropsWithChildren) {
    const { isOnline } = useConnectivity();
    const { selectedVehicleId } = useDriverSession();
    const bootstrappedVehiclesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!isOnline || !selectedVehicleId) return;
        const vehicleKey = String(selectedVehicleId);
        if (bootstrappedVehiclesRef.current.has(vehicleKey)) return;

        let isCancelled = false;

        (async () => {
            try {
                const mapData = await getDriverMapData(vehicleKey);
                if (isCancelled) return;
                await saveDriverMapData(mapData);

                const cached = await listCachedPuulaanit();
                const cachedIds = new Set(cached.map((entry) => entry.puulaaniId));

                const puulaaniIds = Array.from(
                    new Set(
                        (mapData?.puulaanit ?? [])
                            .map((location) => {
                                const numericId = Number(location.id);
                                return Number.isNaN(numericId) ? null : numericId;
                            })
                            .filter((id): id is number => id !== null)
                    )
                );

                console.log(
                    '[DriverOfflineBootstrap] Bootstrap summary',
                    {
                        vehicleKey,
                        totalPuulaanit: puulaaniIds.length,
                        alreadyCached: cachedIds.size,
                        cachedIds: Array.from(cachedIds.values()),
                    }
                );

                await Promise.all(
                    puulaaniIds.map(async (puulaaniId) => {
                        if (cachedIds.has(puulaaniId) || isCancelled) return;
                        try {
                            const details = await getTimberStackFullDetails(puulaaniId);
                            if (!isCancelled) {
                                await savePuulaaniDetails(puulaaniId, details);
                                console.log('[DriverOfflineBootstrap] Cached puulaani details', {
                                    vehicleKey,
                                    puulaaniId,
                                    name: details?.puulaani?.nimi,
                                });
                            }
                        } catch (error) {
                            console.log('[DriverOfflineBootstrap] Failed to cache puulaani details', error);
                        }
                    })
                );

                if (!isCancelled) {
                    bootstrappedVehiclesRef.current.add(vehicleKey);
                }
            } catch (error) {
                console.log('[DriverOfflineBootstrap] Failed to bootstrap driver offline data', error);
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, [isOnline, selectedVehicleId]);

    return <>{children}</>;
}
