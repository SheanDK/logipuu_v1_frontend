// frontend/src/app/[lng]/(main)/timber-stacks/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Paper, CircularProgress, Alert, Snackbar, AlertColor, useTheme, alpha } from '@mui/material';
import ForestIcon from '@mui/icons-material/Forest';
import dayjs from 'dayjs';
import 'leaflet/dist/leaflet.css';
import L, { Map } from 'leaflet';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, useMap } from 'react-leaflet';

import { useAuth } from '../../../../contexts/AuthContext';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useMapData } from '../../../../hooks/useMapData';
import {
    IClientBasicInfo, IMapTimberStack, IMapDropoffLocation, IMapOtherMarker,
    IVehicleLocation, MarkerType, ICreateOtherMarkerDto, PendingPuulaaniData, PuulaaniBasicDetailsFormData, IUpdateOtherMarkerDto, IMapFilterState
} from '../../../../types';
import ChipMarker from '@/components/map/markers/ChipMarker';
import { updateTimberStackLocation } from '../../../../services/timberStackService';
import { deleteDropoffLocation } from '../../../../services/unloadingSiteService';
import { createOtherMarker, deleteOtherMarker, updateOtherMarker } from '../../../../services/otherInfoService';

import { useTranslation } from '@/i18n/useTranslation';
import apiClient from '@/services/apiClient';
const MML_MAASTOKARTTA_URL = 'https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/maastokartta/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.png?api-key=903ff7d0-9792-4c41-9515-d66f76ccb69f';

// Dynamic component imports
const TimberStackFilterBar = dynamic(() => import('../../../../components/timber-stacks/TimberStackFilterBar'), { ssr: false });
const PuulaaniMarker = dynamic(() => import('../../../../components/map/markers/PuulaaniMarker'), { ssr: false });
const PurkupaikkaMarker = dynamic(() => import('../../../../components/map/markers/PurkupaikkaMarker'), { ssr: false });
const MuuMerkkiMarker = dynamic(() => import('../../../../components/map/markers/MuuMerkkiMarker'), { ssr: false });
const VehicleMarker = dynamic(() => import('../../../../components/map/markers/VehicleMarker'), { ssr: false });
const AddMarkerOnClick = dynamic(() => import('../../../../components/map/markers/AddMarkerOnClick'), { ssr: false });
const TypeSelectionDialog = dynamic(() => import('../../../../components/map/dialogs/TypeSelectionDialog'), { ssr: false });
const DetailsDialog = dynamic(() => import('../../../../components/map/dialogs/DetailsDialog'), { ssr: false });
const PuulaaniDetailsModal = dynamic(() => import('../../../../components/map/dialogs/PuulaaniDetailsModal'), { ssr: false });
const ConfirmationDialog = dynamic(() => import('../../../../components/common/ConfirmationDialog'), { ssr: false });
const PurkupaikkaFormModal = dynamic(() => import('../../../../components/map/dialogs/PurkupaikkaFormModal'), { ssr: false });
const OtherMarkerFormModal = dynamic(() => import('../../../../components/map/dialogs/OtherMarkerFormModal'), { ssr: false });


if (typeof window !== 'undefined') {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/images/marker-icon-2x.png',
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/marker-shadow.png',
    });
}

const AnimationController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
    const map: Map = useMap(); // Get the map instance

    useEffect(() => {
        // This effect runs only once when the component mounts
        map.flyTo(center, zoom, {
            animate: true,
            duration: 1.5 // Animation duration in seconds
        });
    }, [center, zoom, map]); // Dependencies ensure this re-runs if mapSettings change

    return null; // This component does not render anything
};


export default function TimberStacksPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { mapSettings } = useLayout();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [filters, setFilters] = useState<IMapFilterState>({
        status: 'active',
        clientId: null,
        vehicleId: null,
        markerTypes: ['puulaani', 'purkupaikka', 'chip-transport'],
    });

    // useMapData is not aware of markerTypes, so we pass only what it needs
    const apiFilters = useMemo(() => ({
        status: filters.status,
        clientId: filters.clientId,
        vehicleId: filters.vehicleId,
    }), [filters.status, filters.clientId, filters.vehicleId]);

    const { isLoading, mapError, data, lists, reloadData, setLocalData } = useMapData(filters);
    const { timberStacks, dropoffLocations, otherMarkers } = data;
    const { clientList, vehicleList } = lists;

    const [isSaving, setIsSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: AlertColor }>({ open: false, message: '', severity: 'info' });
    const [vehicleLocations] = useState<Record<string, IVehicleLocation>>({});
    const [activeModal, setActiveModal] = useState<'none' | 'type' | 'puulaani-details' | 'puulaani-finalize' | 'purkupaikka' | 'other-marker'>('none');
    const [pendingCoords, setPendingCoords] = useState<[number, number] | null>(null);
    const [pendingPuulaani, setPendingPuulaani] = useState<Partial<PendingPuulaaniData>>({});
    const [modalError, setModalError] = useState<string | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: MarkerType, item: any } | null>(null);
    const [selectedStackForEditing, setSelectedStackForEditing] = useState<IMapTimberStack | null>(null);
    const [selectedDropoffForEditing, setSelectedDropoffForEditing] = useState<IMapDropoffLocation | null>(null);
    const [selectedOtherMarkerForEditing, setSelectedOtherMarkerForEditing] = useState<IMapOtherMarker | null>(null);
    const [moveConfirmation, setMoveConfirmation] = useState<IMapTimberStack | null>(null);
    const [markerToEnableMove, setMarkerToEnableMove] = useState<number | null>(null);
    const [chipMarkers, setChipMarkers] = useState<any[]>([]);

    useEffect(() => {
        apiClient.get('/chip-planning/map-data')
            .then(res => setChipMarkers(res.data))
            .catch(err => console.error("Chip Map Data Error:", err));
    }, []);

    const canView = useMemo(() => user?.permissions?.includes('timber map_view'), [user]);
    const canCreate = useMemo(() => user?.permissions?.includes('timber map_create'), [user]);

    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const isFinland = mapSettings.key === 'finland';
    const { t } = useTranslation('map');


    useEffect(() => {
        const markerTypesFromUrl = searchParams.get('markerTypes')?.split(',');
        setFilters({
            status: (searchParams.get('status') as 'all' | 'active') || 'active',
            clientId: searchParams.get('clientId') || null,
            vehicleId: searchParams.get('vehicleId') || null,
            markerTypes: (markerTypesFromUrl as ('puulaani' | 'purkupaikka')[] | undefined) || ['puulaani', 'purkupaikka'],
        });
    }, [searchParams]);

    const filteredTimberStacks = useMemo(() => {
        let stacks = timberStacks ?? [];
        if (!filters.markerTypes.includes('puulaani')) return [];
        if (filters.clientId) {
            stacks = stacks.filter(stack => String(stack.clientId) === String(filters.clientId));
        }
        return stacks;
    }, [timberStacks, filters.markerTypes, filters.clientId]);

    const filteredDropoffLocations = useMemo(() => {
        let locations = dropoffLocations ?? [];
        if (!filters.markerTypes.includes('purkupaikka')) return [];
        if (filters.clientId) {
            locations = locations.filter(loc => String(loc.clientId) === String(filters.clientId));
        }
        return locations.filter(loc => loc.latitude != null && loc.longitude != null && loc.isVisibleOnMap);
    }, [dropoffLocations, filters.markerTypes, filters.clientId]);

    const filteredChipTransports = useMemo(() => {
        let transports = chipMarkers ?? [];
        if (!filters.markerTypes.includes('chip-transport')) return [];
        if (filters.clientId) {
            transports = transports.filter(transport => String(transport.clientId) === String(filters.clientId));
        }
        return transports.filter(transport => transport.originLat != null && transport.originLong != null);
    }, [chipMarkers, filters.markerTypes, filters.clientId]);

    const handleFilterChange = useCallback((name: keyof IMapFilterState, value: any) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        if (name === 'markerTypes') {
            if (value && Array.isArray(value) && value.length > 0) {
                currentParams.set(name, value.join(','));
            } else {
                currentParams.delete(name);
            }
        } else {
            if (value) {
                currentParams.set(name, String(value));
            } else {
                currentParams.delete(name);
            }
        }
        const newQueryString = currentParams.toString();
        router.push(`${pathname}?${newQueryString}`);
    }, [searchParams, pathname, router]);

    const typeLabel = (type: MarkerType) => {
        if (type === 'Puulaani') return t('types.timberStack');
        if (type === 'Purkupaikka') return t('types.dropoff');
        return t('types.other');
    };

    const handleLocationChange = async (id: number, newLocation: { latitude: number, longitude: number }) => {
        const originalStacks = [...(timberStacks || [])];
        const updatedStacks = originalStacks.map(stack => stack.id === id ? { ...stack, ...newLocation } : stack);
        setLocalData({ timberStacks: updatedStacks });
        try {
            await updateTimberStackLocation(id, newLocation);
            setSnackbar({ open: true, message: t('messages.locationUpdated'), severity: 'success' });
            setMarkerToEnableMove(null);
        } catch (err: any) {
            setSnackbar({ open: true, message: t('errors.updateLocationFailed'), severity: 'error' });
            setLocalData({ timberStacks: originalStacks });
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        setIsSaving(true);
        const { type, item } = deleteConfirmation;
        try {
            let successMessageKey = ''; // Variable to hold the correct translation key

            if (type === 'Puulaani') {
                await deactivateTimberStack(item.id);
                successMessageKey = 'messages.archived'; // Use 'archived' for soft-delete
            } else if (type === 'Purkupaikka') {
                await deleteDropoffLocation(item.id);
                successMessageKey = 'messages.deleted'; // Use 'deleted' for hard-delete
            } else if (type === 'Muu merkki') {
                await deleteOtherMarker(item.id);
                successMessageKey = 'messages.deleted'; // Use 'deleted' for hard-delete
            }

            // --- THE FIX IS HERE ---
            // Use the determined key to show the correct snackbar message.
            setSnackbar({
                open: true,
                message: t(successMessageKey, { type: typeLabel(type), name: item.name }),
                severity: 'success'
            });

            await reloadData();

        } catch (err: any) {
            const errorMsg = err.response?.data?.message || t('errors.deleteFailed', { type: typeLabel(type) });
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setIsSaving(false);
            setDeleteConfirmation(null);
        }
    };

    const handleCloseModals = (didChange: boolean = false) => {
        if (didChange) reloadData();
        setActiveModal('none');
        setPendingPuulaani({});
        setSelectedStackForEditing(null);
        setSelectedDropoffForEditing(null);
        setSelectedOtherMarkerForEditing(null);
        setPendingCoords(null);
        setModalError(null);
        setMarkerToEnableMove(null);
    };

    const handleMapClick = (coords: [number, number]) => {
        if (!canCreate) { setSnackbar({ open: true, message: t('errors.noPermissionAdd'), severity: 'info' }); return; }
        setPendingCoords(coords);
        setActiveModal('type');
    };

    const handleTypeSelected = (type: MarkerType) => {
        if (type === 'Puulaani') {
            setPendingPuulaani({ latitude: pendingCoords![0], longitude: pendingCoords![1], date: dayjs() });
            setActiveModal('puulaani-details');
        } else if (type === 'Purkupaikka') {
            setActiveModal('purkupaikka');
        } else if (type === 'Muu merkki') {
            setActiveModal('other-marker');
        }
    };

    const handleDetailsSubmitted = (basicData: PuulaaniBasicDetailsFormData) => {
        setPendingPuulaani((prev: Partial<PendingPuulaaniData>) => ({ ...prev, ...basicData }));
        setActiveModal('puulaani-finalize');
    };

    const handleFinalSaveSuccess = async () => {
        setSnackbar({ open: true, message: t('messages.stackSaved'), severity: 'success' });
        handleCloseModals(true);
    };

    const handleSaveOtherMarker = async (data: ICreateOtherMarkerDto | IUpdateOtherMarkerDto, id?: number) => {
        setIsSaving(true); setModalError(null);
        try {
            if (id) {
                await updateOtherMarker(id, data);
                setSnackbar({ open: true, message: t('messages.otherMarkerUpdated'), severity: 'success' });
            } else {
                if (!pendingCoords) throw new Error("Cannot create marker without coordinates.");
                const payloadToSend: ICreateOtherMarkerDto = { name: data.name!, iconType: data.iconType!, color: data.color!, additionalInfo: data.additionalInfo || null, latitude: pendingCoords[0], longitude: pendingCoords[1] };
                await createOtherMarker(payloadToSend);
                setSnackbar({ open: true, message: t('messages.otherMarkerCreated'), severity: 'success' });
            }
            handleCloseModals(true);
        } catch (err: any) { setModalError(err.response?.data?.message || t('errors.saveFailed')); }
        finally { setIsSaving(false); }
    };

    const handleOpenEditModal = (stack: IMapTimberStack) => {
        setPendingCoords(null);
        setPendingPuulaani({});
        setSelectedDropoffForEditing(null);
        setSelectedOtherMarkerForEditing(null);
        setSelectedStackForEditing(stack);
        setActiveModal('puulaani-finalize');
    };

    const handleOpenEditDropoffModal = (dropoff: IMapDropoffLocation) => {
        setSelectedDropoffForEditing(dropoff);
        setActiveModal('purkupaikka');
    };

    const handleOpenEditOtherMarkerModal = (marker: IMapOtherMarker) => {
        setSelectedOtherMarkerForEditing(marker);
        setActiveModal('other-marker');
    };

    const handleDoubleClick = (marker: IMapTimberStack) => {
        if (markerToEnableMove !== null) {
            setSnackbar({ open: true, message: t('messages.alreadyUnlocked'), severity: 'info' });
            return;
        }
        setMoveConfirmation(marker);
    };

    const confirmMove = () => {
        if (moveConfirmation) {
            setMarkerToEnableMove(moveConfirmation.id);
            setSnackbar({ open: true, message: t('messages.unlocked', { name: moveConfirmation.name }), severity: 'info' });
        }
        setMoveConfirmation(null);
    };

    if (isAuthLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    if (!canView) return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">{t('errors.noPermissionView')}</Alert></Paper>;

    return (
        <Box sx={{ height: 'calc(100vh - 55px)', width: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 35, right: 0, zIndex: 1000, p: 2 }}>
                <Paper sx={{
                    p: 2,
                    backgroundColor: isDarkMode
                        ? alpha(theme.palette.background.paper, 0.8)
                        : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 2,
                    border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ForestIcon color="primary" />
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 'bold',
                                    color: 'text.primary'
                                }}
                            >
                                {t('title')}
                            </Typography>
                        </Box>
                    </Box>
                    <TimberStackFilterBar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        clientList={clientList}
                        vehicleList={vehicleList}
                        isLoading={isLoading}
                    />
                    {mapError && <Alert severity="error" sx={{ mt: 1 }}>{mapError}</Alert>}
                </Paper>
            </Box>

            <Box sx={{ height: '100%', width: '100%' }}>
                {isLoading && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%', zIndex: 5 }} />}

                <MapContainer
                    className={theme.palette.mode === 'dark' ? 'leaflet-dark' : undefined}
                    center={[20, 0]}
                    zoom={6}
                    scrollWheelZoom={true}
                    minZoom={6}
                    maxZoom={18}
                    style={{ height: '100%', width: '100%' }}
                >
                    <AnimationController center={mapSettings.center} zoom={mapSettings.zoom} />
                    <LayersControl position="bottomleft">
                        {/* Base Layers */}
                        {isFinland && (
                            <LayersControl.BaseLayer checked name={t('layers.finnishTopographic', 'MML Maastokartta (FI)')}>
                                <TileLayer
                                    url={MML_MAASTOKARTTA_URL}
                                    maxZoom={18}
                                    attribution='&copy; <a href="https://www.maanmittauslaitos.fi/">Maanmittauslaitos</a>'
                                />
                            </LayersControl.BaseLayer>
                        )}
                        <LayersControl.BaseLayer checked={!isFinland} name={t('layers.standard')}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name={t('layers.satellite')}>
                            <TileLayer url='https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}' maxZoom={20} subdomains={['mt0', 'mt1', 'mt2', 'mt3']} /></LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name={t('layers.topographic')}>
                            <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" maxZoom={17} /></LayersControl.BaseLayer>

                        {/* Overlays */}
                        <LayersControl.Overlay checked name={t('layers.timberStacks')}>
                            <FeatureGroup>
                                {filteredTimberStacks.map((stack: IMapTimberStack) => {
                                    const fallback: IClientBasicInfo = { id: '0', name: 'Unknown Client', clientId: '0', clientName: 'Unknown Client', targetColor: '#808080' };
                                    const customer = (clientList ?? []).find((c: IClientBasicInfo) => String(c.clientId) === String(stack.clientId)) ?? fallback;
                                    const markerWithColor: IMapTimberStack = { ...stack, clientColor: stack.clientColor ?? customer.targetColor ?? '#808080' };
                                    return (
                                        <PuulaaniMarker
                                            key={`stack-${stack.id}`}
                                            marker={markerWithColor}
                                            customer={customer}
                                            isDraggable={markerToEnableMove === stack.id}
                                            onEdit={handleOpenEditModal}
                                            onDelete={(m) => setDeleteConfirmation({ type: 'Puulaani', item: m })}
                                            onLocationChange={handleLocationChange}
                                            onDoubleClick={handleDoubleClick}
                                        />
                                    );
                                })}
                            </FeatureGroup>
                        </LayersControl.Overlay>

                        <LayersControl.Overlay checked name={t('layers.unloadingSites')}>
                            <FeatureGroup>
                                {filteredDropoffLocations.map((loc: IMapDropoffLocation) => (
                                    <PurkupaikkaMarker
                                        key={`loc-${loc.id}`}
                                        marker={loc}
                                        onEdit={handleOpenEditDropoffModal}
                                        onDelete={(m) => setDeleteConfirmation({ type: 'Purkupaikka', item: m })}
                                    />
                                ))}
                            </FeatureGroup>
                        </LayersControl.Overlay>

                        <LayersControl.Overlay checked name={t('layers.otherMarkers')}>
                            <FeatureGroup>
                                {(otherMarkers || []).map((marker: IMapOtherMarker) => (
                                    <MuuMerkkiMarker
                                        key={`other-${marker.id}`}
                                        marker={marker}
                                        onEdit={handleOpenEditOtherMarkerModal}
                                        onDelete={(m: IMapOtherMarker) => setDeleteConfirmation({ type: 'Muu merkki', item: m })}
                                    />
                                ))}
                            </FeatureGroup>
                        </LayersControl.Overlay>

                        <LayersControl.Overlay checked name={t('layers.vehicles')}>
                            <FeatureGroup>
                                {Object.values(vehicleLocations).map(vehicle => <VehicleMarker key={`vehicle-${vehicle.id}`} vehicle={vehicle} />)}
                            </FeatureGroup>
                        </LayersControl.Overlay>

                        <LayersControl.Overlay checked name={t('layers.chipTransports', 'Chip Transports')}>
                            <FeatureGroup>
                                {filteredChipTransports.map((marker) => (
                                    <ChipMarker key={`chip-title-${marker.id}`} marker={marker} />
                                ))}
                            </FeatureGroup>
                        </LayersControl.Overlay>
                    </LayersControl>

                    <AddMarkerOnClick onAddMarkerAction={handleMapClick} />
                </MapContainer>
            </Box>

            {/* Modals and Dialogs */}
            {/* The full code for these components is omitted for brevity but should be present in your file */}
            <TypeSelectionDialog open={activeModal === 'type'} onCancelAction={handleCloseModals} onTypeSelect={handleTypeSelected} />
            <DetailsDialog open={activeModal === 'puulaani-details'} onCancelAction={handleCloseModals} onNextAction={handleDetailsSubmitted} clientList={clientList} />
            {activeModal === 'puulaani-finalize' && <PuulaaniDetailsModal open={true} onCloseAction={handleCloseModals} onSaveSuccessAction={handleFinalSaveSuccess} initialData={selectedStackForEditing || pendingPuulaani} clientList={clientList} showMap={false} />}
            <PurkupaikkaFormModal open={activeModal === 'purkupaikka'} onCloseAction={handleCloseModals} onDataChangeAction={reloadData} clientList={clientList} initialCoords={selectedDropoffForEditing ? null : (pendingCoords ? { lat: pendingCoords[0], lng: pendingCoords[1] } : null)} siteToEdit={selectedDropoffForEditing} />
            <OtherMarkerFormModal open={activeModal === 'other-marker'} onCloseAction={handleCloseModals} onSaveAction={handleSaveOtherMarker} isSaving={isSaving} error={modalError} initialData={selectedOtherMarkerForEditing} />
            <ConfirmationDialog open={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)} onConfirm={confirmDelete} title={t('confirm.delete.title', { type: typeLabel(deleteConfirmation?.type as MarkerType) })} message={t('confirm.delete.message', { name: deleteConfirmation?.item?.name ?? '' })} isConfirming={isSaving} />
            <ConfirmationDialog open={!!moveConfirmation} onClose={() => setMoveConfirmation(null)} onConfirm={confirmMove} title={t('confirm.unlock.title')} message={t('confirm.unlock.message', { name: moveConfirmation?.name ?? '' })} confirmButtonText={t('confirm.unlock.confirmBtn')} />
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert></Snackbar>
        </Box>
    );
}

function deactivateTimberStack(id: any) {
    throw new Error('Function not implemented.');
}
