// frontend/src/app/(main)/loads/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, Paper, Alert, Button, IconButton, Tooltip, Snackbar, Chip, Stack, Divider } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId, GridRowModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportIcon from '@mui/icons-material/Report';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { ChipProps } from '@mui/material/Chip';

import EditLoadModal from '../../../../components/loads/EditLoadModal';
import ConfirmationDialog from '../../../../components/common/ConfirmationDialog';
import InspectionFilterBar, { ILoadFilters } from '../../../../components/loads/InspectionFilterBar';
import { ILoadListItem, IClientBasicInfo, IVehicleBasicInfo, IDriver, IBackendClient, IVehicleBackendResponse, IBackendDriver, ITripDetails, IUpdateLoadDto } from '../../../../types';
import { fetchAllLoads, getTripById, deleteLoad, updateLoad, fetchLoadsForInspection, acceptLoadsForInvoicing, ILoadListApiFilters } from '../../../../services/loadService';
import { fetchAllClients } from '@/services/clientService';
import { fetchAllVehicles } from '@/services/vehicleService';
import { fetchAllDrivers } from '@/services/driverService';
import { useAuth } from '@/contexts/AuthContext';
import useSocket from '@/hooks/useSocket'; // Import useSocket

const STATUS_COLOR: Record<string, ChipProps['color']> = {
    assigned: 'warning',
    in_progress: 'info',
    at_origin: 'warning',
    en_route_to_destination: 'info',
    at_destination: 'warning',
    completed: 'success',
    paused: 'error',
};

const STATUS_TKEY: Record<string, string> = {
    'Assigned': 'assigned',
    'In Progress': 'in_progress',
    'At Origin': 'at_origin',
    'En Route to Destination': 'en_route_to_destination',
    'At Destination': 'at_destination',
    'Completed': 'completed',
    'Paused': 'paused',
};

export default function DrivenInspectionPage() {

    const { t } = useTranslation('loadsPage');
    const { user } = useAuth();
    const { socket } = useSocket(); // Socket connection

    const [rows, setRows] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedLoadForEditing, setSelectedLoadForEditing] = useState<ITripDetails | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: AlertColor } | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<ILoadListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // --- FIX 1: Add loadType to initial filter state ---
    const [filters, setFilters] = useState<ILoadFilters>({ 
        status: 'pending_inspection', 
        asiakasId: '', 
        kalustoNro: '', 
        kuljId: '',
        loadType: '' 
    });
    
    const [clientList, setClientList] = useState<IClientBasicInfo[]>([]);
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);
    const [driverList, setDriverList] = useState<IDriver[]>([]);
    const [selectionModel, setSelectionModel] = useState<Set<GridRowId>>(new Set());
    const [isAccepting, setIsAccepting] = useState(false);
    const [acceptConfirmationOpen, setAcceptConfirmationOpen] = useState(false);

    const isInspectionView = useMemo(() => filters.status === 'pending_inspection', [filters.status]);

    const loadData = useCallback(async (currentFilters: ILoadFilters) => {
        try {
            setIsLoading(true);
            setError(null);
            setSelectionModel(new Set());

            let data;
            if (currentFilters.status === 'pending_inspection') {
                // For inspection view, we might not use all filters, but let's stick to the base logic
                // If you want filters to apply to inspection view too, you should use fetchAllLoads with status='pending_inspection'
                // But per your original code:
                data = await fetchLoadsForInspection();
            } else {
                // --- FIX 2: Correctly map filters and parse loadType to number/undefined ---
                const filtersForApi: ILoadListApiFilters = {
                    asiakasId: currentFilters.asiakasId || undefined,
                    kalustoNro: currentFilters.kalustoNro || undefined,
                    kuljId: currentFilters.kuljId || undefined,
                    // Parse "0" or "1" to number, empty string becomes undefined
                    loadType: (currentFilters.loadType !== '' && currentFilters.loadType !== undefined) 
                        ? parseInt(currentFilters.loadType, 10) 
                        : undefined,
                };

                if (currentFilters.status === 'active' || currentFilters.status === 'all') {
                    filtersForApi.status = currentFilters.status;
                }

                data = await fetchAllLoads(filtersForApi);
            }

            setRows(data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || t('errors.fetchLoads'));
        } finally {
            setIsLoading(false);
        }
    }, [t]); // Added dependency

    // --- FIX 3: Socket Listener for Real-time Updates ---
    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = (updatedLoad: any) => {
            console.log("Socket: Load status updated", updatedLoad);
            // Option A: Reload data to be safe (easiest)
            // loadData(filters);

            // Option B: Optimistic update (faster)
            setRows((prevRows) => {
                const index = prevRows.findIndex(r => r.kuormaId === updatedLoad.kuormaId);
                if (index > -1) {
                    const newRows = [...prevRows];
                    // If the status change makes it fall out of the current filter (e.g. active -> completed), remove it
                    // But for simplicity, we just update the row data
                    newRows[index] = { ...newRows[index], ...updatedLoad };
                    
                    // If we are in 'active' view and load becomes 'Completed', we might want to filter it out
                    if (filters.status === 'active' && updatedLoad.status === 'Completed') {
                         return newRows.filter(r => r.kuormaId !== updatedLoad.kuormaId);
                    }
                    return newRows;
                }
                return prevRows;
            });
        };

        socket.on('loadStatusUpdated', handleStatusUpdate);

        return () => {
            socket.off('loadStatusUpdated', handleStatusUpdate);
        };
    }, [socket, filters, loadData]);

    useEffect(() => {
        const loadFilterDropdowns = async () => {
            try {
                const [clients, vehicles, drivers] = await Promise.all([fetchAllClients(), fetchAllVehicles(), fetchAllDrivers()]);
                setClientList(clients.map((c: IBackendClient) => ({ id: String(c.asiakkaanId), name: c.asiakkaanNimi, clientId: String(c.asiakkaanId), clientName: c.asiakkaanNimi, targetColor: c.kohteenVari })));
                setVehicleList(vehicles.map((v: IVehicleBackendResponse) => ({ id: String(v.kalustoNro), name: v.rekNro, vehicleNo: String(v.kalustoNro), registrationNo: v.rekNro })));
                setDriverList(drivers.map((d: IBackendDriver) => ({ driverId: d.kuljId, name: d.nimi, phoneNo: d.puhelinNro, email: d.email, hasAlerts: d.halytys })));
            } catch (error) {
                console.error("Failed to load filter options:", error);
                setSnackbar({ open: true, message: t('errors.loadFilterOptions'), severity: 'warning' });
            }
        };
        loadFilterDropdowns();
    }, []);

    useEffect(() => { loadData(filters); }, [filters, loadData]);

    const handleOpenEditModal = async (loadItem: ILoadListItem) => {
        try {
            const fullLoadData = await getTripById(loadItem.kuormaId);
            setSelectedLoadForEditing(fullLoadData);
            setIsEditModalOpen(true);
        } catch (err) {
            setSnackbar({ open: true, message: t('errors.fetchLoadDetails'), severity: 'error' });
        }
    };

    const handleFilterChange = (name: keyof ILoadFilters, value: string | null) => { 
        setFilters(prev => ({ ...prev, [name]: value as any })); 
    };
    
    const handleResetFilters = () => { 
        setFilters({ status: 'pending_inspection', asiakasId: '', kalustoNro: '', kuljId: '', loadType: '' }); 
    };
    
    const handleCloseModal = () => { setIsEditModalOpen(false); setSelectedLoadForEditing(null); };
    const handleSaveSuccess = (message: string) => { handleCloseModal(); loadData(filters); setSnackbar({ open: true, message, severity: 'success' }); };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation || !user) return; // Added user check
        setIsDeleting(true);
        try {
            await deleteLoad(deleteConfirmation.kuormaId, user);
            setSnackbar({ open: true, message: t('snackbar.deleted', { id: deleteConfirmation.kuormaId }), severity: 'success' });
            setDeleteConfirmation(null);
            await loadData(filters);
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || t('errors.deleteFailed'), severity: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleProcessRowUpdate = useCallback(async (newRow: GridRowModel<ILoadListItem>): Promise<ILoadListItem> => {
        if (!user) {
             setSnackbar({ open: true, message: 'User not authenticated', severity: 'error' });
             return rows.find(r => r.kuormaId === newRow.kuormaId)!;
        }

        const payload: IUpdateLoadDto = {
            pvm: dayjs(newRow.pvm, "DD.MM.YYYY").toDate(),
            vastaanottoNro: newRow.vastaanottoNro, reitti: newRow.reitti,
            m3: newRow.m3, km: newRow.km, tunnit: newRow.tunnit,
            kpl: newRow.kpl, lisatiedot: newRow.lisatiedot
        };
        try {
            await updateLoad(newRow.kuormaId, payload, user);
            setSnackbar({ open: true, message: t('snackbar.updated', { id: newRow.kuormaId }), severity: 'success' });
            return newRow;
        } catch (err: any) {
            setSnackbar({ open: true, message: t('snackbar.updateFailed'), severity: 'error' });
            return rows.find(r => r.kuormaId === newRow.kuormaId)!;
        }
    }, [rows, user, t]);

    const toggleSelection = (id: GridRowId) => {
        setSelectionModel(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
            return newSet;
        });
    };

    const handleAcceptClick = () => { setAcceptConfirmationOpen(true); };

    const handleConfirmAccept = async () => {
        setIsAccepting(true);
        try {
            const acceptedIds = Array.from(selectionModel);
            await acceptLoadsForInvoicing(acceptedIds);
            setSnackbar({ open: true, message: t('snackbar.acceptedForInvoicing', { count: acceptedIds.length }), severity: 'success' });
            await loadData(filters); 
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || t('errors.acceptFailed'), severity: 'error' });
        } finally {
            setIsAccepting(false);
            setAcceptConfirmationOpen(false);
        }
    };

    const handleReportClick = () => {
        const selectedIds = Array.from(selectionModel);
        if (selectedIds.length === 0) {
            setSnackbar({ open: true, message: t('warnings.selectRowsForReport'), severity: 'warning' });
            return;
        }
        const selectedRowsData = rows.filter(row => selectedIds.includes(row.kuormaId));
        localStorage.setItem('reportData', JSON.stringify(selectedRowsData));
        window.open('/reports/load-report', '_blank');
    };

    const handleCloseSnackbar = () => setSnackbar(null);

    const translateStatus = (t: (k: string, o?: any) => string, status?: string | null) => {
        if (!status) return t('status.na', { defaultValue: '—' }); 
        const key = STATUS_TKEY[status];
        return key ? t(`status.${key}`, { defaultValue: status }) : status;
    };

    const getStatusChipColorByStatus = (status?: string | null): ChipProps['color'] => {
        const key = status ? STATUS_TKEY[status] : undefined;
        return key ? (STATUS_COLOR[key] ?? 'default') : 'default';
    };

    const columns: GridColDef[] = [
        {
            field: 'select',
            headerName: t('columns.select'),
            width: 80,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams<any, ILoadListItem>) => {
                const isSelected = selectionModel.has(params.id);
                return (
                    <Tooltip title={isSelected ? t('tooltips.removeFromSelection') : t('tooltips.addToSelection')}>
                        <IconButton size="small" color={isSelected ? "error" : "primary"} onClick={() => toggleSelection(params.id)}>
                            {isSelected ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
                        </IconButton>
                    </Tooltip>
                );
            },
        },
        { field: 'pvm', headerName: t('columns.date'), width: 110},
        { field: 'ajomaaraysNro', headerName: t('columns.drivingOrder'), width: 130 },
        { field: 'vastaanottoNro', headerName: t('columns.receptionNo'), width: 130},
        { field: 'rekNro', headerName: t('columns.vehicleNo'), width: 110 },
        { field: 'kuljettajanNimi', headerName: t('columns.driver'), width: 100 },
        { field: 'puulaaniNimi', headerName: t('columns.puulaani'), width: 100 },
        { field: 'asiakkaanNimi', headerName: t('columns.customer'), width: 140 },
        { field: 'timberType', headerName: t('columns.timber'), width: 120 },
        { field: 'reitti', headerName: t('columns.route'), width: 100 },
        { field: 'm3', headerName: t('columns.cubicMetres'), type: 'number', width: 120},
        { field: 'km', headerName: t('columns.freightKm'), type: 'number', width: 120 },
        { field: 'tunnit', headerName: t('columns.hours'), type: 'number', width: 100 },
        { field: 'kpl', headerName: t('columns.pcs'), type: 'number', width: 80},
        { field: 'lisatiedot', headerName: t('columns.additionalInfo'), flex: 1, minWidth: 80},
        {
            field: 'status',
            headerName: t('columns.status'),
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={translateStatus(t, params.row.status)}
                    color={getStatusChipColorByStatus(params.row.status)}
                    size="small"
                />
            )
        },

        {
            field: 'actions', headerName: t('columns.action'), width: 100, sortable: false, filterable: false,
            renderCell: (params) => (<Box><Tooltip title={t('tooltips.editLoad')}><IconButton onClick={() => handleOpenEditModal(params.row)} size="small"><EditIcon /></IconButton></Tooltip><Tooltip title={t('tooltips.deleteLoad')}><IconButton onClick={() => setDeleteConfirmation(params.row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip></Box>),
        },
    ];

    return (
        <Box sx={{ p: 3, width: '100%', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <Paper variant="outlined" sx={{ p: 2, flexShrink: 0, borderColor: 'rgba(0, 0, 0, 0.12)' }}>
                <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>{t('title')}</Typography>
                        <Stack direction="row" spacing={1}>
                            {isInspectionView && (
                                <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} disabled={selectionModel.size === 0} onClick={handleAcceptClick}>
                                    {t('buttons.accept', { count: selectionModel.size })}
                                </Button>
                            )}
                            <Button variant="outlined" startIcon={<ReportIcon />} onClick={handleReportClick} disabled={selectionModel.size === 0}>
                                {t('buttons.report', { count: selectionModel.size })}
                            </Button>
                        </Stack>
                    </Box>
                    <Divider />
                    <InspectionFilterBar 
                        filters={filters} 
                        onFilterChangeAction={handleFilterChange} 
                        onResetFiltersAction={handleResetFilters} 
                        clientList={clientList} 
                        vehicleList={vehicleList} 
                        driverList={driverList} 
                    />
                </Stack>
            </Paper>

            {error && <Alert severity="error" sx={{ flexShrink: 0, mt: 2 }}>{error}</Alert>}

            <Paper sx={{ flexGrow: 1, width: '100%', mt: 2, overflow: 'hidden' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(r) => r.kuormaId}
                    loading={isLoading}
                    processRowUpdate={isInspectionView ? handleProcessRowUpdate : undefined}
                    isCellEditable={(params) => !!(isInspectionView && params.colDef.editable)}
                    onProcessRowUpdateError={(e) => console.error(e)}
                    editMode="row"
                    hideFooterSelectedRowCount
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' },
                        '& .MuiDataGrid-columnHeaderTitle': { fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' },
                    }}
                />
            </Paper>

            {isEditModalOpen && selectedLoadForEditing && user && (
                <EditLoadModal 
                open={isEditModalOpen} 
                onCloseAction={handleCloseModal} 
                onSaveSuccessAction={handleSaveSuccess} 
                loadData={selectedLoadForEditing} 
                currentUser={user} 
                />
                )}

            <ConfirmationDialog open={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)} onConfirm={handleConfirmDelete} title={t('confirm.delete.title')} message={t('confirm.delete.message', { id: deleteConfirmation?.kuormaId ?? '' })} isConfirming={isDeleting} />

            <ConfirmationDialog
                open={acceptConfirmationOpen}
                onClose={() => setAcceptConfirmationOpen(false)}
                onConfirm={handleConfirmAccept}
                title={t('confirm.accept.title')}
                message={t('confirm.accept.message', { count: selectionModel.size })}
                isConfirming={isAccepting}
                confirmButtonText={t('confirm.accept.confirmButtonText')}
                confirmButtonColor="success"
            />

            <Snackbar open={!!snackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert onClose={handleCloseSnackbar} severity={snackbar?.severity || 'info'} sx={{ width: '100%' }}>{snackbar?.message}</Alert></Snackbar>
        </Box>
    );
}