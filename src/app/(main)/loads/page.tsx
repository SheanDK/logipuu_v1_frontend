// frontend/src/app/(main)/loads/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress, Button, IconButton, Tooltip, Snackbar, Chip, Stack, Divider } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId, GridRowModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportIcon from '@mui/icons-material/Report';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import dayjs from 'dayjs';

import EditLoadModal from '../../../components/loads/EditLoadModal';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import InspectionFilterBar, { ILoadFilters } from '../../../components/loads/InspectionFilterBar';
import { ILoadListItem, ILoad, IClientBasicInfo, IVehicleBasicInfo, IDriver, IBackendClient, IVehicleBackendResponse, IBackendDriver, ILoadDetails, IUpdateLoadDto } from '../../../types';
import { fetchAllLoads, getLoadById, deleteLoad, updateLoad, fetchLoadsForInspection, acceptLoadsForInvoicing, ILoadListApiFilters } from '../../../services/loadService';
import { fetchAllClients } from '@/services/clientService';
import { fetchAllVehicles } from '@/services/vehicleService';
import { fetchAllDrivers } from '@/services/driverService';

const getStatusChipColor = (status: string | undefined | null): "success" | "info" | "warning" | "error" | "default" => {
    switch (status) {
        case 'Completed': return 'success';
        case 'In Progress': case 'En Route to Destination': return 'info';
        case 'Assigned': case 'At Origin': case 'At Destination': return 'warning';
        case 'Paused': return 'error';
        default: return 'default';
    }
};

export default function DrivenInspectionPage() {
    const [rows, setRows] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedLoadForEditing, setSelectedLoadForEditing] = useState<ILoadDetails | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: AlertColor } | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<ILoadListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filters, setFilters] = useState<ILoadFilters>({ status: 'pending_inspection', asiakasId: '', kalustoNro: '', kuljId: '' });
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
                data = await fetchLoadsForInspection();
            } else {
                // --- THIS IS THE FIX (PART 3) ---
                // Create a new object for the API call that matches the API's expected type.
                const filtersForApi: ILoadListApiFilters = {
                    asiakasId: currentFilters.asiakasId || undefined,
                    kalustoNro: currentFilters.kalustoNro || undefined,
                    kuljId: currentFilters.kuljId || undefined,
                };
                
                // Only add the 'status' property if it's 'active' or 'all'.
                // This prevents sending an empty string ''.
                if (currentFilters.status === 'active' || currentFilters.status === 'all') {
                    filtersForApi.status = currentFilters.status;
                }
                
                data = await fetchAllLoads(filtersForApi);
            }
            
            setRows(data);
        } catch (err: any) { 
            setError(err.response?.data?.message || "Failed to fetch loads.");
        } finally { 
            setIsLoading(false); 
        }
    }, []);

    useEffect(() => {
        const loadFilterDropdowns = async () => {
            try {
                const [clients, vehicles, drivers] = await Promise.all([ fetchAllClients(), fetchAllVehicles(), fetchAllDrivers() ]);
                setClientList(clients.map((c: IBackendClient) => ({ id: String(c.asiakkaanId), name: c.asiakkaanNimi, clientId: String(c.asiakkaanId), clientName: c.asiakkaanNimi, targetColor: c.kohteenVari })));
                setVehicleList(vehicles.map((v: IVehicleBackendResponse) => ({ id: String(v.kalustoNro), name: v.rekNro, vehicleNo: String(v.kalustoNro), registrationNo: v.rekNro })));
                setDriverList(drivers.map((d: IBackendDriver) => ({ driverId: d.kuljId, name: d.nimi, phoneNo: d.puhelinNro, email: d.email, hasAlerts: d.halytys })));
            } catch (error) { 
                console.error("Failed to load filter options:", error);
                setSnackbar({ open: true, message: 'Could not load all filter options.', severity: 'warning' });
            }
        };
        loadFilterDropdowns();
    }, []);

    useEffect(() => { loadData(filters); }, [filters, loadData]);

    const handleOpenEditModal = async (loadItem: ILoadListItem) => {
        try {
            const fullLoadData = await getLoadById(loadItem.kuormaId);
            setSelectedLoadForEditing(fullLoadData);
            setIsEditModalOpen(true);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to fetch load details for editing.', severity: 'error' });
        }
    };
    
    const handleFilterChange = (name: keyof ILoadFilters, value: string | null) => { setFilters(prev => ({ ...prev, [name]: value as any })); };
    const handleResetFilters = () => { setFilters({ status: 'pending_inspection', asiakasId: '', kalustoNro: '', kuljId: '' }); };
    const handleCloseModal = () => { setIsEditModalOpen(false); setSelectedLoadForEditing(null); };
    const handleSaveSuccess = (message: string) => { handleCloseModal(); loadData(filters); setSnackbar({ open: true, message, severity: 'success' }); };
    
    const handleConfirmDelete = async () => {
        if (!deleteConfirmation) return;
        setIsDeleting(true);
        try {
            await deleteLoad(deleteConfirmation.kuormaId);
            setSnackbar({ open: true, message: `Load #${deleteConfirmation.kuormaId} deleted.`, severity: 'success' });
            setDeleteConfirmation(null);
            await loadData(filters);
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete load.', severity: 'error' });
        } finally {
            setIsDeleting(false);
        }
     };

    const handleProcessRowUpdate = useCallback(async (newRow: GridRowModel<ILoadListItem>): Promise<ILoadListItem> => {
        const payload: IUpdateLoadDto = { 
            pvm: dayjs(newRow.pvm, "DD.MM.YYYY").toDate(),
            vastaanottoNro: newRow.vastaanottoNro, reitti: newRow.reitti, 
            m3: newRow.m3, km: newRow.km, tunnit: newRow.tunnit, 
            kpl: newRow.kpl, lisatiedot: newRow.lisatiedot 
        };
        try {
            await updateLoad(newRow.kuormaId, payload);
            setSnackbar({ open: true, message: `Load #${newRow.kuormaId} updated.`, severity: 'success' });
            return newRow;
        } catch (err: any) {
            setSnackbar({ open: true, message: 'Update failed.', severity: 'error' });
            return rows.find(r => r.kuormaId === newRow.kuormaId)!;
        }
    }, [rows]);
    
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
            setSnackbar({ open: true, message: `${acceptedIds.length} loads accepted for invoicing.`, severity: 'success' });
            await loadData(filters); // Reload data to reflect changes
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to accept loads.', severity: 'error' });
        } finally {
            setIsAccepting(false);
            setAcceptConfirmationOpen(false);
        }
     };

    const handleReportClick = () => {
        const selectedIds = Array.from(selectionModel);
        if (selectedIds.length === 0) {
            setSnackbar({ open: true, message: 'Please select rows to generate a report.', severity: 'warning' });
            return;
        }
        const selectedRowsData = rows.filter(row => selectedIds.includes(row.kuormaId));
        localStorage.setItem('reportData', JSON.stringify(selectedRowsData));
        window.open('/reports/driven-inspection', '_blank');
    };

    const handleCloseSnackbar = () => setSnackbar(null);

    const columns: GridColDef[] = [
        {
            field: 'select',
            headerName: 'Select',
            width: 80,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams<any, ILoadListItem>) => {
                const isSelected = selectionModel.has(params.id);
                return (
                    <Tooltip title={isSelected ? "Remove from selection" : "Add to selection"}>
                        <IconButton size="small" color={isSelected ? "error" : "primary"} onClick={() => toggleSelection(params.id)}>
                            {isSelected ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
                        </IconButton>
                    </Tooltip>
                );
            },
        },
        { field: 'pvm', headerName: 'Date', width: 110, editable: isInspectionView },
        { field: 'ajomaaraysNro', headerName: 'Driving Order No.', width: 140 },
        { field: 'vastaanottoNro', headerName: 'Reception No.', width: 130, editable: isInspectionView },
        { field: 'rekNro', headerName: 'AutoNro', width: 110 },
        { field: 'kuljettajanNimi', headerName: 'Driver', width: 150 },
        { field: 'puulaaniNimi', headerName: 'Puulaani', width: 150 },
        { field: 'asiakkaanNimi', headerName: 'Customer', width: 150 },
        { field: 'timberType', headerName: 'Timber', width: 120 },
        { field: 'reitti', headerName: 'Driving route', width: 150, editable: isInspectionView },
        { field: 'm3', headerName: 'Cubic metres (m³)', type: 'number', width: 140, editable: isInspectionView },
        { field: 'km', headerName: 'Freight (km)', type: 'number', width: 120, editable: isInspectionView },
        { field: 'tunnit', headerName: 'Hours', type: 'number', width: 100, editable: isInspectionView },
        { field: 'kpl', headerName: 'Pcs', type: 'number', width: 80, editable: isInspectionView },
        { field: 'lisatiedot', headerName: 'Additional information', flex: 1, minWidth: 200, editable: isInspectionView },
        { 
            field: 'status', 
            headerName: 'Status', 
            width: 150, renderCell: (params) => ( 
            <Chip 
                label={params.row.status || 'N/A'} 
                color={getStatusChipColor(params.row.status)} 
                size="small"/> ) },
        {
            field: 'actions', headerName: 'Action', width: 100, sortable: false, filterable: false,
            renderCell: (params) => (<Box><Tooltip title="Edit Load"><IconButton onClick={() => handleOpenEditModal(params.row)} size="small"><EditIcon /></IconButton></Tooltip><Tooltip title="Delete Load"><IconButton onClick={() => setDeleteConfirmation(params.row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip></Box>),
        },
    ];

    return (
        <Box sx={{ p: 3, width: '100%', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <Paper variant="outlined" sx={{ p: 2, flexShrink: 0, borderColor: 'rgba(0, 0, 0, 0.12)' }}>
                <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>Driven managements / Inspection</Typography>
                        <Stack direction="row" spacing={1}>
                            {isInspectionView && (
                                <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} disabled={selectionModel.size === 0} onClick={handleAcceptClick}>
                                    Accept ({selectionModel.size})
                                </Button>
                            )}
                            <Button variant="outlined" startIcon={<ReportIcon />} onClick={handleReportClick} disabled={selectionModel.size === 0}>
                                Report ({selectionModel.size})
                            </Button>
                        </Stack>
                    </Box>
                    <Divider />
                    <InspectionFilterBar filters={filters} onFilterChangeAction={handleFilterChange} onResetFiltersAction={handleResetFilters} clientList={clientList} vehicleList={vehicleList} driverList={driverList}/>
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

            {isEditModalOpen && selectedLoadForEditing && ( <EditLoadModal open={isEditModalOpen} onCloseAction={handleCloseModal} onSaveSuccessAction={handleSaveSuccess} loadData={selectedLoadForEditing} /> )}
            
            <ConfirmationDialog open={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)} onConfirm={handleConfirmDelete} title="Confirm Load Deletion" message={`Are you sure you want to delete Load #${deleteConfirmation?.kuormaId}?`} isConfirming={isDeleting}/>
            
            <ConfirmationDialog
                open={acceptConfirmationOpen}
                onClose={() => setAcceptConfirmationOpen(false)}
                onConfirm={handleConfirmAccept}
                title="Confirm Acceptance"
                message={`Are you sure you want to accept these ${selectionModel.size} loads for invoicing?`}
                isConfirming={isAccepting}
                confirmButtonText="Yes, Accept"
                confirmButtonColor="success"
            />

            <Snackbar open={!!snackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert onClose={handleCloseSnackbar} severity={snackbar?.severity || 'info'} sx={{ width: '100%' }}>{snackbar?.message}</Alert></Snackbar>
        </Box>
    );
}