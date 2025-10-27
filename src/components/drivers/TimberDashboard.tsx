// frontend/src/components/drivers/TimberDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Paper, CircularProgress, Alert, Button, Stack, List, ListItemText, Divider, Typography, ListItemButton, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';
import RestoreIcon from '@mui/icons-material/Restore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import { LeafletMouseEvent } from 'leaflet';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useConnectivity } from '@/hooks/useConnectivity';
import {
    loadDriverMapData,
    saveDriverMapData,
    loadPuulaaniDetails,
    savePuulaaniDetails,
    hasPuulaaniDetails,
} from '@/offline/driverCache';

// --- Types ---
import { TripMapProps, TripLegForMap } from '../loads/TripMap';
import { PuulaaniDetails, ICreateLoadDto, LoadTypeEnum, ILoad } from '@/types';

// --- Services ---
import { getDriverMapData, DriverMapData, getActiveTripForDriver, updateTimberEntryStatus } from '@/services/driverViewService';
import { getTimberStackFullDetails, updateTimberStackFull } from '@/services/timberStackService';
import { createLoad, deleteLoad, getLoadById, getLoadForEdit, updateLoad, updateLoadStatus } from '@/services/loadService';

// --- Child Components ---
const TripMap = dynamic<TripMapProps>(() => import('../loads/TripMap'), { ssr: false, loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box> });
const PuulaaniDetailsPanel = dynamic(() => import('../loads/PuulaaniDetailsPanel'), { ssr: false });
const CreateLoadModal = dynamic(() => import('../loads/CreateLoadModal'), { ssr: false });
const ActiveTripPanel = dynamic(() => import('./ActiveTripPanel'), { ssr: false });
const ConfirmationDialog = dynamic(() => import('../common/ConfirmationDialog'), { ssr: false });

// --- Inner Components ---
const MapView = ({ puulaanit, purkupaikat, onMarkerClick, currentLocation }: {
    puulaanit: any[],
    purkupaikat: any[],
    onMarkerClick: (id: number, event: LeafletMouseEvent) => void,
    currentLocation: { lat: number; lng: number } | null
}) => {
    const puulaaniMarkers: TripLegForMap[] = useMemo(() => puulaanit.map(p => ({ kuormaId: p.id, originName: p.name, originCoords: { lat: Number(p.latitude), lng: Number(p.longitude) } })), [puulaanit]);
    const purkupaikkaMarkers: TripLegForMap[] = useMemo(() => purkupaikat.map(p => ({ kuormaId: p.id * -1, originName: p.name, originCoords: { lat: Number(p.latitude), lng: Number(p.longitude) } })), [purkupaikat]);

    return (<TripMap legs={[]} puulaanit={puulaaniMarkers} purkupaikat={purkupaikkaMarkers} driverLocation={currentLocation} onMarkerClickAction={onMarkerClick} {...{ focusedTripId: null, onFocusCompleteAction: () => { } }} />);
};

// ListView: simple, scrollable list of puulaanit with dividers between items.
const ListView = ({ puulaanit, onPuulaaniClick }: { puulaanit: any[], onPuulaaniClick: (id: number) => void }) => {
    const { t } = useTranslation('timberDashboard'); // <-- lisää tämä

    return (
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 1, flexShrink: 0 }}>
                {t('list.header')}
            </Typography>
            <Divider />
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <List>
                    {puulaanit.map((p, index) => (
                        <React.Fragment key={p.id}>
                            <ListItemButton onClick={() => onPuulaaniClick(p.id)}>
                                <ListItemText primary={p.name} />
                            </ListItemButton>
                            {index < puulaanit.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Box>
        </Paper>
    );
};

// --- Props and helper types ---

interface TimberDashboardProps { onBackAction: () => void; }

interface CreateLoadJobMetadata extends Record<string, unknown> {
    jobType: 'createLoad';
    puulaaniId: number;
    tempId: string;
    payload: ICreateLoadDto;
    display: {
        puutavaralaji: string;
        haettu: number;
        vastaanottoNro?: string | null;
        kuljettajanNimi?: string | null;
    };
}

interface UpdateLoadJobMetadata extends Record<string, unknown> {
    jobType: 'updateLoad';
    puulaaniId: number;
    loadId: number;
    payload: {
        vastaanottoNro: string | null;
        m3: number;
        km: number;
        reitti: string | null;
        lisatiedot: string | null;
        notes?: string | null;
    };
}

interface DeleteLoadJobMetadata extends Record<string, unknown> {
    jobType: 'deleteLoad';
    puulaaniId: number;
    loadId: number;
}

interface UpdateLoadStatusJobMetadata extends Record<string, unknown> {
    jobType: 'updateLoadStatus';
    puulaaniId: number;
    loadId: number;
    status: string;
    context?: 'start' | 'update';
}

type LoadJobMetadata =
    | CreateLoadJobMetadata
    | UpdateLoadJobMetadata
    | DeleteLoadJobMetadata
    | UpdateLoadStatusJobMetadata;

type BaseRelatedLoad = PuulaaniDetails['relatedLoads'][number];
type SerializableRelatedLoad = Omit<BaseRelatedLoad, 'jaljella'> & {
    jaljella?: string;
    metadata?: LoadJobMetadata | null;
    isOfflineDraft?: boolean;
    tempId?: string;
    route?: string | null;
    reitti?: string | null;
    km?: number | string | null;
    lisatiedot?: string | null;
    notes?: string | null;
    m3?: number | string | null;
    vastaanottoNro?: string | null;
    puutavaraId?: number | null;
    puulaaniId?: number | null;
};

interface PendingLoadDisplay extends SerializableRelatedLoad {
    tempId: string;
    isOfflineDraft: true;
    metadata: CreateLoadJobMetadata;
}

const normalizeRelatedLoad = (load: any): SerializableRelatedLoad => {
    if (!load) return {} as SerializableRelatedLoad;
    const {
        jaljella,
        haettu,
        m3,
        kuljettajanNimi,
        ...rest
    } = load;

    const resolvedHaettu = haettu ?? m3 ?? 0;
    const resolvedM3 = m3 ?? haettu ?? 0;
    const jaljellaValue =
        typeof jaljella === 'function'
            ? resolvedHaettu
            : jaljella ?? resolvedHaettu;

    return {
        ...rest,
        kuljettajanNimi: kuljettajanNimi ?? '',
        haettu: String(resolvedHaettu),
        m3: String(resolvedM3),
        jaljella: jaljellaValue !== undefined ? String(jaljellaValue) : undefined,
    };
};


export default function TimberDashboard({ onBackAction }: TimberDashboardProps) {
    // --- Contexts ---
    const { selectedVehicleId, setActiveTrip } = useDriverSession();
    const { user, token } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const { isOnline, queue, queueSnapshot } = useConnectivity();

    // --- Theming helpers for translucent floating panel styling ---
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const controlSurface = alpha(theme.palette.background.paper, isDarkMode ? 0.85 : 0.94);
    const controlBorder = alpha(theme.palette.divider, isDarkMode ? 0.6 : 0.28);
    const controlShadow = isDarkMode ? '0 12px 32px rgba(0,0,0,0.65)' : '0 16px 24px rgba(15,23,42,0.16)';

    // Local UI state
    const [view, setView] = useState<'map' | 'list'>('map');
    const [mapData, setMapData] = useState<DriverMapData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; } | null>(null);
    const [selectedPuulaaniDetails, setSelectedPuulaaniDetails] = useState<PuulaaniDetails | null>(null);
    const [isPanelLoading, setIsPanelLoading] = useState(false);
    const [isCreateLoadModalOpen, setIsCreateLoadModalOpen] = useState(false);
    const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
    const [loadToEdit, setLoadToEdit] = useState<any | null>(null);
    const [loadToDelete, setLoadToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeLoad, setActiveLoad] = useState<any | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isTripPanelVisible, setIsTripPanelVisible] = useState(true);
    const { t } = useTranslation('timberDashboard');

    // Build a map of puulaaniId -> list of pending offline loads for display.
    const pendingLoadsByPuulaani = useMemo(() => {
    const map = new Map<number, PendingLoadDisplay[]>();
    queueSnapshot.jobs.forEach((job) => {
        const metadata = job.metadata as LoadJobMetadata | undefined;
        const puulaaniId = typeof metadata?.puulaaniId === 'number' && Number.isFinite(metadata.puulaaniId) && metadata.puulaaniId > 0
            ? metadata.puulaaniId
            : undefined;
        if (!metadata || metadata.jobType !== 'createLoad' || puulaaniId === undefined) {
            return;
        }

        const tempId = metadata.tempId;
        // Use a negative, time-based synthetic ID to avoid collisions with server IDs.
        const tempNumericId = -Math.abs(job.createdAt || Date.now());
        const baseLoad = normalizeRelatedLoad({
            status: 'Pending Sync',
            kuormaId: tempNumericId,
            kuljId: Number(metadata.payload?.kuljId ?? 0),
            kuljettajanNimi: metadata.display?.kuljettajanNimi ?? user?.fullName ?? '',
            puutavaralaji: metadata.display?.puutavaralaji ?? null,
            pvm: new Date(job.createdAt).toISOString(),
            haettu: metadata.display?.haettu ?? metadata.payload?.m3 ?? 0,
            m3: metadata.payload?.m3 ?? metadata.display?.haettu ?? 0,
            vastaanottoNro: metadata.display?.vastaanottoNro ?? metadata.payload?.vastaanottoNro ?? null,
        });

        const pendingLoad: PendingLoadDisplay = {
            ...baseLoad,
            tempId,
            isOfflineDraft: true,
            metadata,
        };

        const list = map.get(puulaaniId) ?? [];
        const alreadyExists = list.some((item) => item.tempId === pendingLoad.tempId);
        if (!alreadyExists) {
            list.push(pendingLoad);
                map.set(puulaaniId, list);
        }
    });

        // Sort each list newest-first (by pvm ISO string).
        map.forEach((list) => list.sort((a, b) => (a.pvm > b.pvm ? -1 : 1)));
        return map;
    }, [queueSnapshot.jobs, user?.fullName]);

    // Combine selected puulaani details with any offline, pending loads for the same puulaani.
    const selectedPuulaaniWithPending = useMemo(() => {
        if (!selectedPuulaaniDetails) return null;
        const pending = pendingLoadsByPuulaani.get(selectedPuulaaniDetails.puulaani.puulaaniId) ?? [];
        if (!pending.length) {
            return selectedPuulaaniDetails;
        }

        const pendingRows = pending.map((item) => ({
            ...normalizeRelatedLoad(item),
            status: item.status,
            tempId: item.tempId,
            isOfflineDraft: true as const,
            metadata: item.metadata,
        }));

        const existingLoads = (selectedPuulaaniDetails.relatedLoads || [])
            .filter((load: any) => !(load as any)?.isOfflineDraft)
            .map((load: any) => normalizeRelatedLoad(load));

        return {
            ...selectedPuulaaniDetails,
            relatedLoads: [...pendingRows, ...existingLoads],
        };
    }, [pendingLoadsByPuulaani, selectedPuulaaniDetails, user?.driverNumericId, user?.fullName]);

    const pendingOperationsByPuulaani = useMemo(() => {
        const counts = new Map<number, number>();
        queueSnapshot.jobs.forEach((job) => {
            const metadata = job.metadata as LoadJobMetadata | undefined;
            const puulaaniId = typeof metadata?.puulaaniId === 'number' && Number.isFinite(metadata.puulaaniId) && metadata.puulaaniId > 0
                ? metadata.puulaaniId
                : undefined;
            if (puulaaniId === undefined || !metadata) {
                return;
            }
            if (
                metadata.jobType === 'createLoad' ||
                metadata.jobType === 'updateLoad' ||
                metadata.jobType === 'deleteLoad' ||
                metadata.jobType === 'updateLoadStatus'
            ) {
                counts.set(puulaaniId, (counts.get(puulaaniId) ?? 0) + 1);
            }
        });
        return counts;
    }, [queueSnapshot.jobs]);

    // Keep track of previous pending counts to detect when sync cleared a queue.
    const pendingCountsRef = useRef<Map<number, number>>(new Map());

    // Fetch map data (online-first with offline fallback) and prime puulaani caches.
    const fetchMapData = useCallback(async () => {
        if (!selectedVehicleId) {
            setError(t('errors.noVehicle'));
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            if (!isOnline) {

                // Offline: load from cache if available.
                const cached = await loadDriverMapData();
                if (cached) {
                    setMapData(cached.payload);
                    setError(null);
                } else {
                    setError(t('errors.mapLoadOffline'));
                }
                return;
            }

            // Online: fetch fresh data and cache it.
            const data = await getDriverMapData(selectedVehicleId);
            setMapData(data);
            setError(null);
            await saveDriverMapData(data);

            // Warm the details cache for each puulaani so offline clicks work lat
            const puulaaniIds = Array.from(
                new Set(
                    (data?.puulaanit ?? [])
                        .map((location) => {
                            const numericId = Number(location.id);
                            return Number.isNaN(numericId) ? null : numericId;
                        })
                        .filter((id): id is number => id !== null)
                )
            );

            const missingPuulaaniIds: number[] = [];
            for (const puulaaniId of puulaaniIds) {
                if (!(await hasPuulaaniDetails(puulaaniId))) {
                    missingPuulaaniIds.push(puulaaniId);
                }
            }

            await Promise.all(
                missingPuulaaniIds.map(async (puulaaniId) => {
                    try {
                        const details = await getTimberStackFullDetails(puulaaniId);
                        await savePuulaaniDetails(puulaaniId, details);
                        console.info('[TimberDashboard] Cached puulaani details from dashboard fetch', { puulaaniId, name: details?.puulaani?.nimi });
                    } catch (error) {
                        console.error('[TimberDashboard] Failed to cache puulaani from dashboard fetch', { puulaaniId, error });
                    }
                })
            );
        } catch (err) {
            console.error('[TimberDashboard] Failed to fetch map data', err);
            setError(t('errors.mapLoad'));
        } finally {
            setIsLoading(false);
        }
    }, [selectedVehicleId, isOnline, t]);

    // Socket and Geolocation refs for lifecycle management.
    const socketRef = useRef<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);

    // Initial map fetch.
    useEffect(() => { fetchMapData(); }, [fetchMapData]);

    // --- Unified useEffect for Geolocation and Socket.IO ---
    useEffect(() => {
        const startGpsWatcher = () => {
            if (watchIdRef.current !== null) {
                console.log("[GPS] Watcher is already running.");
                return;
            }
            if (!navigator.geolocation) {
                console.error("[GPS] Geolocation is not supported.");
                return;
            }

            const positionOptions: PositionOptions = {
                enableHighAccuracy: false,
                timeout: 20000,
                maximumAge: 10000
            };

            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentLocation({ lat: latitude, lng: longitude });

                    if (socketRef.current?.connected) {
                        console.log(`[GPS] Emitting location: ${latitude}, ${longitude}`);
                        socketRef.current.emit('updateLocation', { lat: latitude, lng: longitude });
                    }
                },
                (error) => {
                    console.error('[GPS] Watch position error:', { code: error.code, message: error.message });
                    enqueueSnackbar(`GPS Error: ${error.message}`, { variant: 'error' });
                },
                positionOptions
            );
            console.log("[GPS] Watcher started.");
        };

        const stopGpsWatcher = () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
                console.log('[GPS] Watcher stopped.');
            }
        };

        // --- Socket Connection Lifecycle ---
        if (activeLoad && !socketRef.current) {
            if (!token || !selectedVehicleId) {
                console.error("[Socket] Pre-condition failed: No token or selected vehicle.");
                return;
            }
            const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000', {
                auth: { token, vehicleId: selectedVehicleId }
            });
            socketRef.current = socket;
            console.log('[Socket] Connecting...');

            socket.on('connect', () => {
                console.log(`[Socket] Connected with ID: ${socket.id}`);
                if (activeLoad.status !== 'Paused') {
                    startGpsWatcher();
                }
            });
            socket.on('disconnect', () => { console.log('[Socket] Disconnected.'); });

        } else if (!activeLoad && socketRef.current) {
            stopGpsWatcher();
            socketRef.current.disconnect();
            socketRef.current = null;
            console.log('[Socket] Disconnecting due to trip completion.');
        }

        // --- GPS Watcher Lifecycle based on PAUSE/RESUME ---
        if (activeLoad) {
            if (activeLoad.status === 'Paused') {
                stopGpsWatcher();
            } else { // 'In Progress' or other active statuses
                startGpsWatcher();
            }
        }

        // --- Cleanup on component unmount ---
        return () => {
            if (socketRef.current) {
                stopGpsWatcher();
                socketRef.current.disconnect();
                socketRef.current = null;
                console.log('[Socket] Disconnected on component unmount.');
            }
        };

    }, [activeLoad, token, selectedVehicleId, enqueueSnackbar]);

    // Switch between views and clear any open detail panel.
    const handleViewChange = (newView: 'map' | 'list') => {
        setSelectedPuulaaniDetails(null);
        setView(newView);
    };

    // Handle clicking on a marker/list item to open puulaani details (online or offline cached).
    const handleMarkerClick = useCallback(async (puulaaniId: number) => {
        if (puulaaniId < 0) return; // ignore purkupaikka clicks here
        setIsTripPanelVisible(false); // hide active trip panel when inspecting a puulaani
        setIsPanelLoading(true);
        setSelectedPuulaaniDetails(null);
        try {
            let puulaaniData: PuulaaniDetails | null = null;
            if (isOnline) {
                puulaaniData = await getTimberStackFullDetails(puulaaniId);
                await savePuulaaniDetails(puulaaniId, puulaaniData);
            } else {
                const cached = await loadPuulaaniDetails(puulaaniId);
                if (!cached) {
                    throw new Error('no-cached-puulaani');
                }
                puulaaniData = cached.payload;
            }
            setSelectedPuulaaniDetails(puulaaniData);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!isOnline && message === 'no-cached-puulaani') {
                console.warn('[TimberDashboard] Puulaani not cached for offline access', { puulaaniId, message });
                enqueueSnackbar(t('toasts.puulaaniOfflineMissing'), { variant: 'warning' });
            } else {
                console.error('[TimberDashboard] Failed to load puulaani details', err);
                enqueueSnackbar(isOnline ? t('toasts.puulaaniLoadError') : t('toasts.puulaaniLoadOffline'), { variant: 'error' });
            }
        } finally {
            setIsPanelLoading(false);
        }
    }, [enqueueSnackbar, isOnline, t]);

    // Open edit modal for a load. Supports offline queueing.
    const handleEditLoad = async (loadId: number) => {
        if (!isOnline) {
            const draft = selectedPuulaaniDetails?.relatedLoads?.find((load: any) => load.kuormaId === loadId);
            if (!draft) {
                enqueueSnackbar(t('toasts.editOfflineNotAvailable'), { variant: 'warning' });
                return;
            }
            enqueueSnackbar(t('toasts.editOfflineNotice'), { variant: 'info' });
            const fallbackPuutavaraId =
                draft.puutavaraId ??
                (draft.metadata as { payload?: { puutavaraId?: number } } | undefined)?.payload?.puutavaraId ??
                null;

            setLoadToEdit({
                kuormaId: draft.kuormaId,
                vastaanottoNro: draft.vastaanottoNro || '',
                m3: Number(draft.haettu ?? draft.m3 ?? 0),
                km: Number(draft.km ?? 0),
                reitti: draft.reitti || draft.route || '',
                route: draft.route || draft.reitti || '',
                lisatiedot: draft.lisatiedot || '',
                notes: draft.notes ?? draft.lisatiedot ?? '',
                puutavaraId: fallbackPuutavaraId,
            });
            setIsCreateLoadModalOpen(true);
            return;
        }
        try {
            const loadData = await getLoadForEdit(loadId);
            setLoadToEdit({
                ...loadData,
                reitti: (loadData as any).reitti ?? (loadData as any).route ?? '',
                route: (loadData as any).route ?? (loadData as any).reitti ?? '',
                lisatiedot: (loadData as any).lisatiedot ?? (loadData as any).notes ?? '',
                notes: (loadData as any).notes ?? (loadData as any).lisatiedot ?? '',
            });
            setIsCreateLoadModalOpen(true);
        } catch (err) {
            enqueueSnackbar(t('toasts.editLoadFetchError'), { variant: 'error' });
        }
    };

    // Create (possibly multiple legs) or update a load. Supports offline queueing.
    const handleCreateOrUpdateLoad = async (data: any, isEdit: boolean) => {
        if (!user || typeof user.driverNumericId !== 'number' || !selectedVehicleId) {
            enqueueSnackbar(t('toasts.invalidSession'), { variant: 'error' });
            return;
        }

        const driverId = user.driverNumericId;
        const vehicleId = Number(selectedVehicleId);
        const currentPuulaaniId = selectedPuulaaniDetails?.puulaani?.puulaaniId;
        const finalizeAfterSubmit = () => {
            setIsCreateLoadModalOpen(false);
            setLoadToEdit(null);

            if (typeof currentPuulaaniId === 'number') {
                handleMarkerClick(currentPuulaaniId);
            }
            fetchMapData();
        };

        if (isEdit) {
            const payload = {
                vastaanottoNro: data.receptionNo ? String(data.receptionNo) : null,
                m3: Number(data.volume),
                km: Number(data.km),
                reitti: data.route ? String(data.route) : null,
                lisatiedot: data.notes ? String(data.notes) : null,
            };

            if (!isOnline) {
                if (currentPuulaaniId == null) {
                    enqueueSnackbar(t("toasts.queueFailed"), { variant: "error" });
                    return;
                }
                try {
                    const metadata: UpdateLoadJobMetadata = {
                        jobType: "updateLoad",
                        loadId: data.kuormaId,
                        puulaaniId: currentPuulaaniId,
                        payload,
                    };
                    await queue.enqueue(
                        {
                            url: `/loads/${data.kuormaId}`,
                            method: "PUT",
                            body: payload,
                            headers: { "Content-Type": "application/json" },
                        },
                        metadata
                    );
                    enqueueSnackbar(t("toasts.loadUpdateQueued"), { variant: "info" });

                    setSelectedPuulaaniDetails((prev) => {
                        if (!prev) return prev;
                        const next: PuulaaniDetails = {
                            ...prev,
                            relatedLoads: prev.relatedLoads.map((load: any) => {
                                if (load.kuormaId === data.kuormaId) {
                                    return normalizeRelatedLoad({
                                        ...load,
                                        vastaanottoNro: payload.vastaanottoNro ?? load.vastaanottoNro,
                                        haettu: payload.m3 ?? load.haettu,
                                        m3: payload.m3 ?? load.m3,
                                        km: payload.km ?? load.km,
                                        reitti: payload.reitti ?? load.reitti,
                                        lisatiedot: payload.lisatiedot ?? load.lisatiedot,
                                    });
                                }
                                return normalizeRelatedLoad(load);
                            }),
                        };
                        void savePuulaaniDetails(next.puulaani.puulaaniId, next);
                        return next;
                    });
                    finalizeAfterSubmit();
                    return;
                } catch (error) {
                    console.error("[TimberDashboard] Failed to queue offline load update", error);
                    enqueueSnackbar(t("toasts.queueFailed"), { variant: "error" });
                }
                return;
            }

            try {
                await updateLoad(data.kuormaId, payload);
                enqueueSnackbar(t("toasts.loadUpdated"), { variant: "success" });
            } catch (err: any) {
                enqueueSnackbar(err.response?.data?.message || t("toasts.loadUpdateFailed"), { variant: "error" });
            }
        } else {
            // --- Create new load(s) ---
            if (!Array.isArray(data) || data.length === 0) {
                enqueueSnackbar(t('toasts.noLegs'), { variant: 'warning' });
                return;
            }

            if (!isOnline) {
                // Offline mode: enqueue POST /loads jobs and show pending rows right away.
                const pendingSummaries: PendingLoadDisplay[] = [];
                try {
                    await Promise.all(
                        data.map((leg: any, index: number) => {
                            const payload: ICreateLoadDto = {
                                tyyppi: LoadTypeEnum.PUULAANI,
                                asiakasId: Number(leg.taskDetails.asiakasId),
                                pvm: new Date(),
                                ajomaaraysNro: null,
                                lisatiedot: leg.notes ?? leg.taskDetails?.notes ?? null,
                                kalustoNro: vehicleId,
                                kuljId: driverId,
                                puulaaniId: Number(leg.taskDetails.puulaaniId),
                                puutavaraId: Number(leg.taskDetails.puutavaraId),
                                lahto: selectedPuulaaniDetails?.puulaani.nimi ?? null,
                                kohde: leg.taskDetails.purkupaikkaName ?? null,
                                m3: Number(leg.volume),
                                km: Number(leg.km ?? leg.taskDetails?.km ?? 0) || 0,
                                reitti: leg.route ?? leg.taskDetails?.reitti ?? null,
                                vastaanottoNro: leg.receptionNo || null,
                            };

                            const tempId = `offline-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
                            const metadata: CreateLoadJobMetadata = {
                                jobType: 'createLoad',
                                puulaaniId: Number(leg.taskDetails.puulaaniId),
                                tempId,
                                payload,
                                display: {
                                    puutavaralaji: leg.taskDetails?.laji ?? 'Timber',
                                    haettu: Number(leg.volume) || 0,
                                    vastaanottoNro: leg.receptionNo || null,
                                    kuljettajanNimi: user.fullName ?? null,
                                },

                            };
                            const routeValue =
                                payload.reitti ??
                                (typeof leg.route === 'string' && leg.route.length > 0 ? leg.route : null);
                            const baseLoad = normalizeRelatedLoad({
                                status: 'Pending Sync',
                                kuormaId: -Math.abs(Date.now() + index),
                                kuljId: driverId,
                                kuljettajanNimi: metadata.display.kuljettajanNimi ?? user.fullName ?? '',
                                puutavaralaji: metadata.display.puutavaralaji ?? null,
                                pvm: new Date().toISOString(),
                                haettu: metadata.display.haettu ?? payload.m3 ?? 0,
                                m3: payload.m3 ?? metadata.display.haettu ?? 0,
                                vastaanottoNro: payload.vastaanottoNro ?? null,
                                reitti: routeValue,
                                route: routeValue ?? '',
                                km: Number(leg.km ?? leg.taskDetails?.km ?? payload.km ?? 0),
                                lisatiedot: leg.notes ?? leg.taskDetails?.notes ?? payload.lisatiedot ?? null,
                                notes: leg.notes ?? leg.taskDetails?.notes ?? undefined,
                                puulaaniId: Number(metadata.payload?.puulaaniId ?? leg.taskDetails?.puulaaniId ?? 0),
                                puutavaraId: Number(metadata.payload?.puutavaraId ?? leg.taskDetails?.puutavaraId ?? 0),
                                metadata,
                                isOfflineDraft: true,
                            });
                            const pendingLoad: PendingLoadDisplay = {
                                ...baseLoad,
                                tempId,
                                isOfflineDraft: true,
                                metadata,
                            };
                            pendingSummaries.push(pendingLoad);

                            return queue.enqueue(
                                {
                                    url: '/loads',
                                    method: 'POST',
                                    body: payload,
                                    headers: { 'Content-Type': 'application/json' },
                                },
                                metadata
                            );
                        })
                    );

                    enqueueSnackbar(t('toasts.loadQueued'), { variant: 'info' });

                    // Optimistically update currently open puulaani details so driver sees pending rows.
                    setSelectedPuulaaniDetails((prev) => {
                        if (!prev) return prev;
                        const existingLoads = prev.relatedLoads || [];
                        const normalizedExisting = existingLoads.map((load: any) => normalizeRelatedLoad(load));

                        const offlineDraftMap = new Map<string, SerializableRelatedLoad>();
                        normalizedExisting
                            .filter((load: any) => (load as any)?.isOfflineDraft)
                            .forEach((draft) => {
                                const key = String(
                                    (draft as any)?.tempId ??
                                    (draft as any)?.kuormaId ??
                                    `legacy-${draft.pvm ?? ''}`
                                );
                                if (!offlineDraftMap.has(key)) {
                                    offlineDraftMap.set(key, draft);
                                }
                            });

                        pendingSummaries.forEach((pending) => {
                            offlineDraftMap.set(String(pending.tempId), pending);
                        });

                        const toTimestamp = (value: SerializableRelatedLoad) => {
                            const raw = value.pvm;
                            if (typeof raw === 'string') {
                                const parsed = Date.parse(raw);
                                return Number.isFinite(parsed) ? parsed : 0;
                            }
                            if (typeof raw === 'number' && Number.isFinite(raw)) {
                                return raw;
                            }
                            return 0;
                        };

                        const mergedOfflineDrafts = Array.from(offlineDraftMap.values()).sort((a, b) => {
                            const diff = toTimestamp(b) - toTimestamp(a);
                            if (diff !== 0) {
                                return diff;
                            }
                            const aKey = String((a as any)?.tempId ?? (a as any)?.kuormaId ?? '');
                            const bKey = String((b as any)?.tempId ?? (b as any)?.kuormaId ?? '');
                            return bKey.localeCompare(aKey);
                        });

                        const confirmedLoads = normalizedExisting.filter((load: any) => !(load as any)?.isOfflineDraft);
                        const nextDetails: PuulaaniDetails = {
                            ...prev,
                            relatedLoads: [...mergedOfflineDrafts, ...confirmedLoads],
                        };
                        void savePuulaaniDetails(nextDetails.puulaani.puulaaniId, nextDetails);
                        return nextDetails;
                    });
                    finalizeAfterSubmit();
                    return;
                } catch (error) {
                    console.error('[TimberDashboard] Failed to queue offline load', error);
                    enqueueSnackbar(t('toasts.queueFailed'), { variant: 'error' });
                    return;
                }
            } else {
                // Online: create all legs in parallel.
                const legEntries = data.map((leg: any) => {
                    const payload: ICreateLoadDto = {
                        tyyppi: LoadTypeEnum.PUULAANI,
                        asiakasId: Number(leg.taskDetails.asiakasId),
                        pvm: new Date(),
                        ajomaaraysNro: null,
                        lisatiedot: leg.notes || leg.taskDetails?.notes || null,
                        kalustoNro: vehicleId,
                        kuljId: driverId,
                        puulaaniId: Number(leg.taskDetails.puulaaniId),
                        puutavaraId: Number(leg.taskDetails.puutavaraId),
                        lahto: selectedPuulaaniDetails?.puulaani.nimi ?? null,
                        kohde: leg.taskDetails.purkupaikkaName ?? null,
                        m3: Number(leg.volume),
                        km: Number(leg.km ?? leg.taskDetails?.km ?? 0) || 0,
                        reitti: leg.route ?? leg.taskDetails?.reitti ?? null,
                        vastaanottoNro: leg.receptionNo || null,
                    };
                    return { payload, leg };
                });

                try {
                    const createdLoads = await Promise.all(legEntries.map(({ payload }) => createLoad(payload)));
                    enqueueSnackbar(t('toasts.loadsCreated'), { variant: 'success' });

                    setSelectedPuulaaniDetails((prev) => {
                        if (!prev) return prev;
                        const normalizedCreated = createdLoads
                            .map((load: ILoad, index: number) => {
                                const loadExtras = load as ILoad & {
                                    kuljettajanNimi?: string;
                                    puutavaralaji?: string | null;
                                    vastaanottoNro?: string | null;
                                    haettu?: number | string | null;
                                    m3?: number | string | null;
                                    lisatiedot?: string | null;
                                    notes?: string | null;
                                    reitti?: string | null;
                                    route?: string | null;
                                    km?: number | string | null;
                                    metadata?: any;
                                    puutavaraId?: number | null;
                                    puulaaniId?: number | null;
                                };

                                const originalEntry = legEntries[index]?.leg;
                                const originalTask = originalEntry?.taskDetails;
                                const originalVolume = Number(originalEntry?.volume ?? originalEntry?.taskDetails?.haettu ?? 0);

                                const originalRoute =
                                    loadExtras.reitti ??
                                    loadExtras.route ??
                                    originalEntry?.route ??
                                    originalTask?.reitti ??
                                    null;
                                const originalNotes =
                                    loadExtras.notes ??
                                    loadExtras.lisatiedot ??
                                    originalEntry?.notes ??
                                    null;
                                const originalKm =
                                    typeof loadExtras.km === 'number'
                                        ? loadExtras.km
                                        : typeof originalEntry?.km === 'number'
                                            ? originalEntry.km
                                            : Number(loadExtras.km ?? 0);
                                const originalPuutavaraId =
                                    loadExtras.puutavaraId ??
                                    originalEntry?.puutavaraId ??
                                    originalTask?.puutavaraId ??
                                    Number(legEntries[index]?.payload?.puutavaraId ?? 0);
                                const originalPuulaaniId =
                                    loadExtras.puulaaniId ??
                                    originalEntry?.taskDetails?.puulaaniId ??
                                    Number(legEntries[index]?.payload?.puulaaniId ?? selectedPuulaaniDetails?.puulaani?.puulaaniId ?? 0);
                                const finalM3 =
                                    typeof loadExtras.m3 === 'number'
                                        ? loadExtras.m3
                                        : Number(loadExtras.m3 ?? originalVolume ?? 0);
                                const finalHaettu =
                                    typeof loadExtras.haettu === 'number'
                                        ? loadExtras.haettu
                                        : Number(loadExtras.haettu ?? finalM3 ?? originalVolume ?? 0);

                                return normalizeRelatedLoad({
                                    ...loadExtras,
                                    status: loadExtras.status ?? (load as any)?.status ?? 'Assigned',
                                    kuljettajanNimi: loadExtras.kuljettajanNimi ?? user.fullName ?? '',
                                    puutavaralaji: loadExtras.puutavaralaji ?? originalTask?.laji ?? null,
                                    vastaanottoNro: loadExtras.vastaanottoNro ?? originalEntry?.receptionNo ?? null,
                                    m3: finalM3,
                                    haettu: finalHaettu,
                                    reitti: originalRoute,
                                    route: originalRoute ?? '',
                                    lisatiedot: originalNotes,
                                    notes: originalNotes ?? undefined,
                                    km: originalKm,
                                    puutavaraId: Number(originalPuutavaraId ?? 0),
                                    puulaaniId: Number(originalPuulaaniId ?? 0),
                                    metadata: loadExtras.metadata ?? null,
                                });
                            });
                        const normalizedExisting = (prev.relatedLoads || []).map((load: any) =>
                                normalizeRelatedLoad({
                                    ...load,
                                })
                        );
                        const nextDetails: PuulaaniDetails = {
                            ...prev,
                            relatedLoads: [...normalizedCreated, ...normalizedExisting],
                        };
                        void savePuulaaniDetails(nextDetails.puulaani.puulaaniId, nextDetails);
                        return nextDetails;
                    });
                } catch (err: any) {
                    enqueueSnackbar(err.response?.data?.message || t('toasts.genericError'), { variant: 'error' });
                }
            }
        }

        // Close modal and refresh details/map.
        finalizeAfterSubmit();
    };

    // Save puulaani timber-entry status changes (driver-specific endpoint).
    const handleSavePuulaani = async (updatedDetails: PuulaaniDetails) => {
        if (!isOnline) {
            enqueueSnackbar(t('toasts.saveOfflineNotAvailable'), { variant: 'info' });
            return;
        }
        try {

            // Create a payload that only contains the information needed to update statuses.
            const payload = updatedDetails.timberEntries.map(e => ({
                puutavaraId: e.puutavaraId,
                valmis: e.valmis
            }));

            // Call the new, dedicated service function for drivers
            await updateTimberEntryStatus(updatedDetails.puulaani.puulaaniId, payload);

            enqueueSnackbar(t('toasts.statusesUpdated'), { variant: 'success' });

            // Refresh the panel data to confirm changes from the server
            handleMarkerClick(updatedDetails.puulaani.puulaaniId);

        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.message || t('toasts.saveFailed'), { variant: 'error' });
        }
    };

    // Delete load (online only) with confirmation dialog.
    const handleDeleteLoad = async () => {
        if (!loadToDelete) return;
        const isOfflineDraft = Boolean((loadToDelete as any)?.isOfflineDraft);
        const tempId: string | undefined = (loadToDelete as any)?.tempId;
        const puulaaniId = selectedPuulaaniDetails?.puulaani?.puulaaniId;

        const removeFromLocalState = (match: (load: any) => boolean) => {
            setSelectedPuulaaniDetails((prev) => {
                if (!prev) return prev;
                const remaining = (prev.relatedLoads || []).filter((load: any) => !match(load));
                const nextDetails: PuulaaniDetails = {
                    ...prev,
                    relatedLoads: remaining,
                };
                void savePuulaaniDetails(nextDetails.puulaani.puulaaniId, nextDetails);
                return nextDetails;
            });
        };

        if (isOfflineDraft) {
            setIsDeleting(true);
            try {
                if (tempId) {
                    const pendingJob = queueSnapshot.jobs.find((job) => {
                        const metadata = job.metadata as LoadJobMetadata | undefined;
                        return metadata?.jobType === 'createLoad' && metadata.tempId === tempId;
                    });
                    if (pendingJob) {
                        await queue.remove(pendingJob.id);
                    }
                }

                removeFromLocalState((load: any) => ((load as any)?.tempId ?? load.kuormaId) === (tempId ?? loadToDelete.kuormaId));
                enqueueSnackbar(t('toasts.offlineDraftCancelled'), { variant: 'info' });
                setLoadToDelete(null);
            } catch (error) {
                console.error('[TimberDashboard] Failed to cancel offline draft load', error);
                enqueueSnackbar(t('toasts.queueFailed'), { variant: 'error' });
            } finally {
                setIsDeleting(false);
            }
            return;
        }

        if (!isOnline) {
            if (puulaaniId == null) {
                enqueueSnackbar(t('toasts.queueFailed'), { variant: 'error' });
                return;
            }
            setIsDeleting(true);
            try {
                const metadata: DeleteLoadJobMetadata = {
                    jobType: 'deleteLoad',
                    loadId: loadToDelete.kuormaId,
                    puulaaniId,
                };
                await queue.enqueue(
                    {
                        url: `/loads/${loadToDelete.kuormaId}`,
                        method: 'DELETE',
                    },
                    metadata
                );
                enqueueSnackbar(t('toasts.loadDeleteQueued'), { variant: 'info' });
                removeFromLocalState((load: any) => load.kuormaId === loadToDelete.kuormaId);
                setLoadToDelete(null);
            } catch (error) {
                console.error('[TimberDashboard] Failed to queue offline load delete', error);
                enqueueSnackbar(t('toasts.queueFailed'), { variant: 'error' });
            } finally {
                setIsDeleting(false);
            }
            return;
        }

        setIsDeleting(true);
        try {
            await deleteLoad(loadToDelete.kuormaId);
            enqueueSnackbar(t('toasts.loadDeleted'), { variant: 'success' });
            setLoadToDelete(null);
            if (selectedPuulaaniDetails) {
                handleMarkerClick(selectedPuulaaniDetails.puulaani.puulaaniId);
            }
        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.message || t('toasts.deleteFailed'), { variant: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    // Watch for offline queue draining: when a puulaani's pending count drops to 0, refresh.
    useEffect(() => {
        const previous = pendingCountsRef.current;
        let shouldRefresh = false;

        const currentCounts = new Map<number, number>(pendingOperationsByPuulaani);

        previous.forEach((prevCount, id) => {
            const currentCount = currentCounts.get(id) ?? 0;
            if (prevCount > 0 && currentCount === 0) {
                shouldRefresh = true;
            }
        });

        pendingCountsRef.current = currentCounts;

        if (shouldRefresh && isOnline) {
            fetchMapData();
            if (selectedPuulaaniDetails) {
                handleMarkerClick(selectedPuulaaniDetails.puulaani.puulaaniId);
            }
        }
    }, [pendingOperationsByPuulaani, isOnline, fetchMapData, selectedPuulaaniDetails, handleMarkerClick]);

    // On mount, check if the driver already has an active trip and attach UI to it.
    useEffect(() => {
        if (!isOnline) {
            return;
        }

        const checkForActiveTrip = async () => {
            try {
                const trip = await getActiveTripForDriver();
                if (trip) {
                    const detailsForPanel = {
                        puulaaniId: Number(trip.puulaaniId ?? -1),
                        puulaaniName: trip.puulaaniName,
                        puulaaniLat: trip.puulaaniLat,
                        puulaaniLng: trip.puulaaniLng,
                        purkupaikkaName: trip.purkupaikkaName,
                        purkupaikkaLat: trip.purkupaikkaLat,
                        purkupaikkaLng: trip.purkupaikkaLng,
                        puutavaralaji: trip.puutavaralaji
                    };
                    setActiveLoad({ ...trip, details: detailsForPanel });
                    setActiveTrip(String(trip.kuormaId));
                }
            } catch (err) {
                console.error("Failed to check for active trip", err);
            }
        };
        checkForActiveTrip();
    }, [isOnline, setActiveTrip]);

    // Begin a trip for a selected load and show the ActiveTripPanel.
    const handleStartTrip = async (load: any) => {
        if (!selectedPuulaaniDetails) return;
        setIsUpdatingStatus(true);
        try {
            let updatedLoad: any;
            const puulaaniIdForStatus = Number(
                selectedPuulaaniDetails?.puulaani?.puulaaniId ?? load?.puulaaniId ?? -1
            );
            if (isOnline) {
                updatedLoad = await updateLoadStatus(load.kuormaId, { status: 'In Progress' });
                enqueueSnackbar(t('toasts.tripStarted'), { variant: 'success' });
            } else {
                await queue.enqueue(
                    {
                        url: `/loads/${load.kuormaId}/status`,
                        method: 'PATCH',
                        body: { status: 'In Progress' },
                        headers: { 'Content-Type': 'application/json' },
                    },
                    {
                        jobType: 'updateLoadStatus',
                        puulaaniId: puulaaniIdForStatus,
                        loadId: load.kuormaId,
                        status: 'In Progress',
                        context: 'start',
                    }
                );
                updatedLoad = { ...load, status: 'In Progress' };
                enqueueSnackbar(t('toasts.tripQueued'), { variant: 'info' });
            }

            const timberEntry = selectedPuulaaniDetails.timberEntries.find((e) => e.puutavaraId === load.puutavaraId);
            const detailsForPanel = {
                puulaaniId: puulaaniIdForStatus,
                puulaaniName: selectedPuulaaniDetails.puulaani.nimi,
                puulaaniLat: selectedPuulaaniDetails.puulaani.sijaintiLat,
                puulaaniLng: selectedPuulaaniDetails.puulaani.sijaintiLong,
                purkupaikkaName: timberEntry?.purkupaikkaName,
                purkupaikkaLat: timberEntry?.purkupaikkaLat,
                purkupaikkaLng: timberEntry?.purkupaikkaLng,
                puutavaralaji: load.puutavaralaji,
            };

            setActiveLoad({ ...updatedLoad, details: detailsForPanel });
            setActiveTrip(String(updatedLoad.kuormaId));
            setSelectedPuulaaniDetails(null);
            setIsTripPanelVisible(true);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message;
            enqueueSnackbar(message || t('toasts.tripStartFailed'), { variant: 'error' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Update status for the active trip (pause/resume/complete).
    const handleStatusUpdate = async (newStatus: string) => {
        if (!activeLoad) return;
        setIsUpdatingStatus(true);
        const localizedStatus = newStatus;

        try {
            let updatedLoad: any;
            const puulaaniIdForStatus = Number(
                selectedPuulaaniDetails?.puulaani?.puulaaniId ??
                activeLoad?.puulaaniId ??
                activeLoad?.details?.puulaaniId ??
                -1
            );
            if (isOnline) {
                updatedLoad = await updateLoadStatus(activeLoad.kuormaId, { status: newStatus });
            } else {
                await queue.enqueue(
                    {
                        url: `/loads/${activeLoad.kuormaId}/status`,
                        method: 'PATCH',
                        body: { status: newStatus },
                        headers: { 'Content-Type': 'application/json' },
                    },
                    {
                        jobType: 'updateLoadStatus',
                        puulaaniId: puulaaniIdForStatus,
                        loadId: activeLoad.kuormaId,
                        status: newStatus,
                        context: 'update',
                    }
                );
                updatedLoad = { ...activeLoad, status: newStatus };
                enqueueSnackbar(t('toasts.statusQueued', { status: localizedStatus }), { variant: 'info' });
            }

            if (newStatus === 'Completed') {
                setActiveLoad(null);
                setActiveTrip(null);
                setSelectedPuulaaniDetails((prev) => {
                    if (!prev) return prev;
                    const remainingLoads = (prev.relatedLoads || []).filter(
                        (load: any) => load.kuormaId !== activeLoad.kuormaId
                    );
                    const nextDetails: PuulaaniDetails = {
                        ...prev,
                        relatedLoads: remainingLoads,
                    };
                    if (!isOnline) {
                        void savePuulaaniDetails(nextDetails.puulaani.puulaaniId, nextDetails);
                    }
                    return nextDetails;
                });
                if (isOnline) {
                    enqueueSnackbar(t('toasts.tripCompleted'), { variant: 'success' });
                    fetchMapData();
                }
            } else {
                setActiveLoad((prev: any) => ({ ...prev, ...updatedLoad }));
                setSelectedPuulaaniDetails((prev) => {
                    if (!prev) return prev;
                    const nextDetails: PuulaaniDetails = {
                        ...prev,
                        relatedLoads: (prev.relatedLoads || []).map((load: any) => {
                            if (load.kuormaId === activeLoad.kuormaId) {
                                return normalizeRelatedLoad({
                                    ...load,
                                    status: newStatus,
                                });
                            }
                            return load;
                        }),
                    };
                    if (!isOnline) {
                        void savePuulaaniDetails(nextDetails.puulaani.puulaaniId, nextDetails);
                    }
                    return nextDetails;
                });
                if (isOnline) {
                    enqueueSnackbar(t('toasts.tripStatusUpdated', { status: localizedStatus }), { variant: 'success' });
                }
            }
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message;
            enqueueSnackbar(message || t('toasts.statusUpdateFailed'), { variant: 'error' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Back navigation that warns when a trip is active.
    const handleBackActionWithConfirmation = () => {
        if (activeLoad) {
            setIsConfirmationOpen(true);
        } else {
            onBackAction();
        }
    };

    // Gate starting a new load when a trip is already active.
    const handleNewLoadRequest = (details: PuulaaniDetails) => {
        // Check if a trip is already active
        if (activeLoad) {
            // If active, show a warning instead of opening the create modal
            enqueueSnackbar(t('toasts.finishActiveTripFirst'), { variant: 'warning' });
        } else {
            setSelectedPuulaaniDetails(details);
            setIsCreateLoadModalOpen(true);
        }
    };

    // Floating actions for the SpeedDial on mobile.
    const actions = [
        { icon: <ArrowBackIcon />, name: t('buttons.changeMode'), handler: onBackAction },
        { icon: view === 'map' ? <ListIcon /> : <MapIcon />, name: view === 'map' ? t('buttons.showList') : t('buttons.showMap'), handler: () => handleViewChange(view === 'map' ? 'list' : 'map') }
    ];

    // Loading & error boundaries for the whole dashboard area.
    if (isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>; }
    if (error) { return <Alert severity="error" color="error" sx={{ m: 2 }}>{error}</Alert>; }

    // --- Main render ---
    return (
        <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>

            {/* Offline banner floats at top center */}
            {!isOnline && (
                <Alert
                    severity="warning"
                    color="warning"
                    sx={{
                        position: 'absolute',
                        top: 72,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1300,
                        width: { xs: '92%', sm: 'auto' },
                        pointerEvents: 'none',
                    }}
                >
                    {t('alerts.offlineMap')}
                </Alert>
            )}

            {/* The Map and List views will now take up the entire screen space */}
            <Box sx={{ height: '100%', width: '100%', display: view === 'map' ? 'block' : 'none' }}>
                <MapView
                    puulaanit={mapData?.puulaanit || []}
                    purkupaikat={mapData?.purkupaikat || []}
                    onMarkerClick={(id) => handleMarkerClick(id)}
                    currentLocation={currentLocation}
                />
            </Box>

            <Box sx={{ height: '100%', display: view === 'list' ? 'block' : 'none' }}>
                {/* Add padding to the top of the list view to avoid being covered by the floating controls */}
                <Box sx={{ pt: { xs: 8, sm: 10 }, height: '100%', p: { xs: 1, sm: 2 } }}>
                    <ListView
                        puulaanit={mapData?.puulaanit || []}
                        onPuulaaniClick={(id) => {
                            handleMarkerClick(id);
                            setView('map');
                        }}
                    />
                </Box>
            </Box>

            {/* Floating Control Panel for Desktop */}
            <Paper
                elevation={0}
                sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    zIndex: 1000,
                    p: 1,
                    backgroundColor: controlSurface,
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    border: `1px solid ${controlBorder}`,
                    boxShadow: controlShadow,
                    display: { xs: 'none', sm: 'flex' }
                }}
            >
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" startIcon={<ArrowBackIcon />} onClick={handleBackActionWithConfirmation}>{t('buttons.changeMode')}</Button>
                    <Button variant="outlined" size="small" startIcon={view === 'map' ? <ListIcon /> : <MapIcon />} onClick={() => handleViewChange(view === 'map' ? 'list' : 'map')}>
                        {view === 'map' ? t('buttons.listView') : t('buttons.mapView')}
                    </Button>
                    {activeLoad && !isTripPanelVisible && (
                        <Button variant="contained" size="small" color="primary" startIcon={<RestoreIcon />} onClick={() => setIsTripPanelVisible(true)}>
                            {t('buttons.showActiveTrip')}
                        </Button>
                    )}
                </Stack>
            </Paper>

            {/* All other floating components */}
            <PuulaaniDetailsPanel
                details={selectedPuulaaniWithPending ?? selectedPuulaaniDetails}
                isLoading={isPanelLoading}
                onCloseAction={() => setSelectedPuulaaniDetails(null)}
                onCreateLoadAction={handleNewLoadRequest}
                onSaveAction={handleSavePuulaani}
                onEditLoadAction={handleEditLoad}
                onDeleteLoadAction={(load) => setLoadToDelete(load)}
                onStartTripAction={handleStartTrip}
                activeLoadId={activeLoad?.kuormaId || null}
                hasActiveTrip={!!activeLoad}
                isOffline={!isOnline}
            />
            <CreateLoadModal
                open={isCreateLoadModalOpen}
                onCloseAction={() => { setIsCreateLoadModalOpen(false); setLoadToEdit(null); }}
                puulaaniDetails={selectedPuulaaniDetails}
                onSubmitAction={handleCreateOrUpdateLoad}
                initialLoadData={loadToEdit}
                isOffline={!isOnline}
            />
            <ActiveTripPanel
                activeLoad={activeLoad}
                open={isTripPanelVisible}
                onToggleVisibilityAction={() => setIsTripPanelVisible((prev) => !prev)}
                onStatusUpdateAction={handleStatusUpdate}
                isUpdating={isUpdatingStatus}
            />

            <ConfirmationDialog
                open={!!loadToDelete}
                onClose={() => setLoadToDelete(null)}
                onConfirm={handleDeleteLoad}
                title={t('dialogs.delete.title')}
                message={t('dialogs.delete.message', { timber: loadToDelete?.puutavaralaji || t('common.na') })}
                isConfirming={isDeleting}
                confirmButtonText={t('dialogs.delete.confirm')}
                confirmButtonColor="error"
            />

            <ConfirmationDialog
                open={isConfirmationOpen}
                onClose={() => setIsConfirmationOpen(false)}
                onConfirm={() => {
                    setIsConfirmationOpen(false);
                    onBackAction();
                }}
                title={t('dialogs.activeTrip.title')}
                message={t('dialogs.activeTrip.message')}
                confirmButtonText={t('dialogs.activeTrip.confirm')}
                confirmButtonColor="warning"
            />

            {/* SpeedDial for Mobile (already a floating component) */}
            <SpeedDial
                ariaLabel={t('speedDial.aria')} sx={{ position: 'absolute', bottom: 16, right: 16, display: { xs: 'flex', sm: 'none' }, zIndex: 1200 }}
                icon={<SpeedDialIcon />} onClose={() => setIsSpeedDialOpen(false)} onOpen={() => setIsSpeedDialOpen(true)} open={isSpeedDialOpen}
                hidden={!!selectedPuulaaniDetails || (!!activeLoad && isTripPanelVisible)}
            >
                {actions.map((action) => (<SpeedDialAction key={action.name} icon={action.icon} tooltipTitle={action.name} onClick={() => { action.handler(); setIsSpeedDialOpen(false); }} />))}
            </SpeedDial>
        </Box>
    );
}









