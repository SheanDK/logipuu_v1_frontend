// frontend/src/app/[lng]/(main)/timber-stacks/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography, Paper, CircularProgress, Alert, Chip, Snackbar, AlertColor, useTheme } from '@mui/material';
import ForestIcon from '@mui/icons-material/Forest';
import dayjs from 'dayjs';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, useMap } from 'react-leaflet';

import { useAuth } from '../../../../contexts/AuthContext';
import { useLayout } from '../../../../contexts/LayoutContext';
import useSocket from '../../../../hooks/useSocket';
import { useMapData } from '../../../../hooks/useMapData';
import {
    IClientBasicInfo, IVehicleBasicInfo, IMapTimberStack, IMapDropoffLocation, IMapOtherMarker,
    IMapFilterState, IVehicleLocation, MarkerType, ICreateTimberStackDto,
    ICreatePurkupaikkaDto, ICreateOtherMarkerDto, PendingPuulaaniData, PuulaaniBasicDetailsFormData,
    IUpdatePurkupaikkaDto, IUpdateOtherMarkerDto, IBackendPurkupaikkaResponse
} from '../../../../types';

import { updateTimberStackLocation, createTimberStack, deleteTimberStack } from '../../../../services/timberStackService';
import { deleteDropoffLocation } from '../../../../services/unloadingSiteService';
import { createOtherMarker, deleteOtherMarker, updateOtherMarker } from '../../../../services/otherInfoService';

import { useTranslation } from '@/i18n/useTranslation';

// Dynamic component imports...
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

const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
    const map = useMap();
    map.setView(center, zoom);
    return null;
};

export default function TimberStacksPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { mapSettings } = useLayout(); // --- 3. Get mapSettings from the context ---
    const { isConnected, lastLocationUpdate } = useSocket();
    const [filters, setFilters] = useState<IMapFilterState>({ status: 'active', clientId: null, vehicleId: null });
    const { isLoading, mapError, data, lists, reloadData, setLocalData } = useMapData(filters);
    const { timberStacks, dropoffLocations, otherMarkers } = data;
    const { clientList, vehicleList } = lists;

    const [isSaving, setIsSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: AlertColor }>({ open: false, message: '', severity: 'info' });
    const [vehicleLocations, setVehicleLocations] = useState<Record<string, IVehicleLocation>>({});

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

    const canView = useMemo(() => user?.permissions?.includes('timber map_view'), [user]);
    const canCreate = useMemo(() => user?.permissions?.includes('timber map_create'), [user]);

    const theme = useTheme();

    const { t } = useTranslation('map');

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
            const updatedStack = updatedStacks.find(s => s.id === id);
            if (updatedStack) {
                setSnackbar({
                    open: true,
                    message: t('messages.locationUpdated', { client: updatedStack.clientName, name: updatedStack.name }),
                    severity: 'success'
                });

            }
            setMarkerToEnableMove(null);
        } catch (err: any) {
            setSnackbar({ open: true, message: t('errors.updateLocationFailed'), severity: 'error' });
            setLocalData({ timberStacks: originalStacks });
            setMarkerToEnableMove(null);
        }
    };

    useEffect(() => {
        if (lastLocationUpdate) {
            const newLocation: IVehicleLocation = {
                id: lastLocationUpdate.vehicleId,
                lat: lastLocationUpdate.lat,
                lng: lastLocationUpdate.lng,
                timestamp: lastLocationUpdate.timestamp
            };
            setVehicleLocations(prev => ({ ...prev, [lastLocationUpdate.vehicleId]: newLocation }));
        }
    }, [lastLocationUpdate]);

    const handleFilterChange = useCallback((name: keyof IMapFilterState, value: any) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleCloseModals = (didChange: boolean = false) => {
        if (didChange) {
            reloadData();
        }
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
        setPendingPuulaani(prev => ({ ...prev, ...basicData }));
        setActiveModal('puulaani-finalize');
    };

    const handleFinalSaveSuccess = async () => {
        setSnackbar({ open: true, message: t('messages.stackSaved'), severity: 'success' });
        handleCloseModals(true); // Close and reload
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
            handleCloseModals(true); // Close and reload
        } catch (err: any) { setModalError(err.response?.data?.message || t('errors.saveFailed')); }
        finally { setIsSaving(false); }
    };

    const handleOpenEditModal = (stack: IMapTimberStack) => {
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

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        setIsSaving(true);
        const { type, item } = deleteConfirmation;
        try {
            if (type === 'Puulaani') await deleteTimberStack(item.id);
            else if (type === 'Purkupaikka') await deleteDropoffLocation(item.id);
            else if (type === 'Muu merkki') await deleteOtherMarker(item.id);
            setSnackbar({ open: true, message: t('messages.deleted', { type: typeLabel(type), name: item.name }), severity: 'success' });
            setDeleteConfirmation(null);
            await reloadData();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || t('errors.deleteFailed');
            if (errorMsg.includes("is still referenced")) {
                setSnackbar({ open: true, message: t('errors.inUse', { name: item.name }), severity: 'error' });
            } else {
                setSnackbar({ open: true, message: errorMsg, severity: 'error' });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isAuthLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    if (!canView) return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">{t('errors.noPermissionView')}</Alert></Paper>;


    const nonEmpty = (v?: string | null): string | undefined => {
    const x = (v ?? '').trim();
    return x.length ? x : undefined;
  };

    return (

        <Box sx={{ height: 'calc(100vh - 64px)', width: '100%', position: 'relative', m: -3, p: 0, overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 35, right: 0, zIndex: 1000, p: 2 }}>
                <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(0.75px)', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ForestIcon color="primary" />
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{t('title')}</Typography>
                        </Box>
                        <Chip label={isConnected ? t('status.connected') : t('status.connecting')} color={isConnected ? 'success' : 'warning'} size="small" variant="outlined" />
                    </Box>
                    <TimberStackFilterBar filters={filters} onFilterChange={handleFilterChange} clientList={clientList} vehicleList={vehicleList} isLoading={isLoading} />
                    {mapError && <Alert severity="error" sx={{ mt: 1 }}>{mapError}</Alert>}
                </Paper>
            </Box>

            <Box sx={{ height: '100%', width: '100%' }}>
                {isLoading && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%', zIndex: 5 }} />}

                <MapContainer
                    className={theme.palette.mode === 'dark' ? 'leaflet-dark' : undefined}
                    center={[62.2426, 25.7473]}
                    zoom={6}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}>

                    <ChangeView center={mapSettings.center} zoom={mapSettings.zoom} />

                    <LayersControl position="bottomleft">
                        <LayersControl.BaseLayer checked name={t('layers.standard')}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        </LayersControl.BaseLayer>

                        <LayersControl.BaseLayer name={t('layers.satellite')}>
                            <TileLayer
                                url='https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}' // 's,h' shows satellite with hybrid (labels)
                                maxZoom={20}
                                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                                attribution='&copy; Google'
                            />
                        </LayersControl.BaseLayer>

                        <LayersControl.BaseLayer name={t('layers.topographic')}>
                            <TileLayer
                                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                                maxZoom={17}
                                attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                            />
                        </LayersControl.BaseLayer>

                        <LayersControl.Overlay checked name={t('layers.timberStacks')}>
                            <FeatureGroup>
                                {(timberStacks ?? []).map(stack => {
                                    const fallback: IClientBasicInfo = {
                                        id: '0',
                                        name: 'Unknown Client',
                                        clientId: '0',
                                        clientName: 'Unknown Client',
                                        targetColor: '#808080',
                                    };

                                    const customer =
                                        (clientList ?? []).find(c => String(c.clientId) === String(stack.clientId)) ??
                                        fallback;

                                    const markerWithColor: IMapTimberStack = {
                                        ...stack,
                                        clientColor: stack.clientColor ?? customer.targetColor ?? '#808080',
                                    };

                                    console.log('stackColor:', stack.clientColor, 'customerColor:', customer.targetColor);

                                    return (
                                        <PuulaaniMarker
                                            key={`stack-${stack.id}`}
                                            marker={markerWithColor}
                                            customer={customer}
                                            isDraggable={markerToEnableMove === stack.id}
                                            onEdit={handleOpenEditModal}
                                            onDelete={m => setDeleteConfirmation({ type: 'Puulaani', item: m })}
                                            onLocationChange={handleLocationChange}
                                            onDoubleClick={handleDoubleClick}
                                        />
                                    );
                                })}
                            </FeatureGroup>
                        </LayersControl.Overlay>


                        <LayersControl.Overlay checked name={t('layers.unloadingSites')}>
                            <FeatureGroup>
                                {(dropoffLocations || [])
                                    .filter(loc => loc.latitude != null && loc.longitude != null && loc.isVisibleOnMap)
                                    .map(loc => (
                                        <PurkupaikkaMarker key={`loc-${loc.id}`} marker={loc} onEdit={handleOpenEditDropoffModal} onDelete={(m) => setDeleteConfirmation({ type: 'Purkupaikka', item: m })} />
                                    ))
                                }
                            </FeatureGroup>
                        </LayersControl.Overlay>


                        <LayersControl.Overlay checked name={t('layers.otherMarkers')}>
                            <FeatureGroup>
                                {(otherMarkers || []).map(marker => <MuuMerkkiMarker key={`other-${marker.id}`} marker={marker} onEdit={handleOpenEditOtherMarkerModal} onDelete={(m) => setDeleteConfirmation({ type: 'Muu merkki', item: m })} />)}
                            </FeatureGroup>
                        </LayersControl.Overlay>


                        <LayersControl.Overlay checked name={t('layers.vehicles')}>
                            <FeatureGroup>
                                {Object.values(vehicleLocations).map(vehicle => <VehicleMarker key={`vehicle-${vehicle.id}`} vehicle={vehicle} />)}
                            </FeatureGroup>
                        </LayersControl.Overlay>
                    </LayersControl>

                    <AddMarkerOnClick onAddMarkerAction={handleMapClick} />
                </MapContainer>
            </Box>

            <TypeSelectionDialog open={activeModal === 'type'} onCancelAction={() => handleCloseModals(false)} onTypeSelect={handleTypeSelected} />

            <DetailsDialog open={activeModal === 'puulaani-details'} onCancelAction={() => handleCloseModals(false)} onNextAction={handleDetailsSubmitted} clientList={clientList} />

            {activeModal === 'puulaani-finalize' && (
                <PuulaaniDetailsModal
                    open={true}
                    onCloseAction={() => handleCloseModals(true)}
                    onSaveSuccessAction={handleFinalSaveSuccess}
                    initialData={selectedStackForEditing || pendingPuulaani}
                    clientList={clientList}
                    showMap={false}
                />)}

            <PurkupaikkaFormModal
                open={activeModal === 'purkupaikka'}
                onCloseAction={handleCloseModals}
                onDataChangeAction={reloadData}
                clientList={clientList}
                initialCoords={selectedDropoffForEditing ? null : (pendingCoords ? { lat: pendingCoords[0], lng: pendingCoords[1] } : null)}
                siteToEdit={selectedDropoffForEditing}
            />

            <OtherMarkerFormModal open={activeModal === 'other-marker'} onCloseAction={() => handleCloseModals(false)} onSaveAction={handleSaveOtherMarker} isSaving={isSaving} error={modalError} initialData={selectedOtherMarkerForEditing} />

            <ConfirmationDialog
                open={!!deleteConfirmation}
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={confirmDelete}
                title={t('confirm.delete.title', { type: typeLabel(deleteConfirmation?.type as MarkerType) })}
                message={t('confirm.delete.message', { name: deleteConfirmation?.item?.name ?? '' })}
                isConfirming={isSaving} />

            <ConfirmationDialog
                open={!!moveConfirmation}
                onClose={() => setMoveConfirmation(null)}
                onConfirm={confirmMove}
                title={t('confirm.unlock.title')}
                message={t('confirm.unlock.message', { name: moveConfirmation?.name ?? '' })}
                confirmButtonText={t('confirm.unlock.confirmBtn')}
            />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
