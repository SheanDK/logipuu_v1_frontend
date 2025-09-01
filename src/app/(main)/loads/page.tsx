// frontend/src/app/(main)/loads/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress, Button, IconButton, Tooltip, Snackbar } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import LoadFormModal from '../../../components/loads/LoadFormModal';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import LoadFilterBar, { ILoadFilters } from '../../../components/loads/LoadFilterBar';
import { 
    ILoadListItem, ILoad, IClientBasicInfo, IVehicleBasicInfo, IDriver, 
    IBackendClient, IVehicleBackendResponse, IBackendDriver 
} from '../../../types';
import { fetchAllLoads, getLoadById, deleteLoad } from '../../../services/loadService';
import { fetchAllClients } from '@/services/clientService';
import { fetchAllVehicles } from '@/services/vehicleService';
import { fetchAllDrivers } from '@/services/driverService';

export default function LoadManagementPage() {
    const [loads, setLoads] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLoadForEditing, setSelectedLoadForEditing] = useState<ILoad | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: AlertColor }>({ open: false, message: '', severity: 'info' });
    const [deleteConfirmation, setDeleteConfirmation] = useState<ILoadListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [filters, setFilters] = useState<ILoadFilters>({ asiakasId: '', kalustoNro: '', kuljId: '' });
    const [clientList, setClientList] = useState<IClientBasicInfo[]>([]);
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);
    const [driverList, setDriverList] = useState<IDriver[]>([]);

    const columns: GridColDef[] = [
        { field: 'kuormaId', headerName: 'ID', width: 90 },
        { field: 'pvm', headerName: 'Date', width: 120 },
        { field: 'asiakkaanNimi', headerName: 'Customer', flex: 1, minWidth: 150 },
        { field: 'lahto', headerName: 'Origin', flex: 1, minWidth: 150 },
        { field: 'kohde', headerName: 'Destination', flex: 1, minWidth: 150 },
        { field: 'rekNro', headerName: 'Vehicle', width: 130 },
        { field: 'kuljettajanNimi', headerName: 'Driver', flex: 1, minWidth: 150 },
        { field: 'tyyppi', headerName: 'Load Type', width: 130 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams<any, ILoadListItem>) => (
                <Box>
                    <Tooltip title="Edit Load"><IconButton onClick={() => handleOpenEditModal(params.row)} size="small"><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Delete Load"><IconButton onClick={() => setDeleteConfirmation(params.row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>
                </Box>
            ),
        },
    ];

    const loadData = useCallback(async (currentFilters: ILoadFilters) => {
        try {
            setIsLoading(true);
            setError(null);
            const activeFilters = Object.fromEntries(Object.entries(currentFilters).filter(([_, value]) => value !== ''));
            const data = await fetchAllLoads(activeFilters as ILoadFilters);
            setLoads(data);
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
                setError("Failed to load filter options."); 
            }
        };
        loadFilterDropdowns();
    }, []);

    useEffect(() => { 
        loadData(filters); 
    }, [filters, loadData]);

    const handleFilterChange = (name: keyof ILoadFilters, value: string) => {
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    };

    const handleOpenCreateModal = () => {
        setSelectedLoadForEditing(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = async (loadItem: ILoadListItem) => {
        try {
            const fullLoadData = await getLoadById(loadItem.kuormaId);
            setSelectedLoadForEditing(fullLoadData);
            setIsModalOpen(true);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to fetch load details.', severity: 'error' });
        }
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLoadForEditing(null);
    };

    const handleSaveSuccess = (message: string) => {
        handleCloseModal();
        loadData(filters);
        setSnackbar({ open: true, message, severity: 'success' });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation) return;
        setIsDeleting(true);
        try {
            await deleteLoad(deleteConfirmation.kuormaId);
            setSnackbar({ open: true, message: `Load #${deleteConfirmation.kuormaId} was successfully deleted.`, severity: 'success' });
            setDeleteConfirmation(null);
            await loadData(filters);
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete load.', severity: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box sx={{ p: 3, width: '100%', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>Load Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal}>Create New Load</Button>
            </Box>

            <Paper sx={{ p: 2, flexShrink: 0 }}>
                <LoadFilterBar
                    filters={filters}
                    onFilterChangeAction={handleFilterChange} // This is now correct
                    clientList={clientList}
                    vehicleList={vehicleList}
                    driverList={driverList}
                />
            </Paper>
            
            {error && <Alert severity="error" sx={{ flexShrink: 0 }}>{error}</Alert>}
            
            <Paper sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
                 <DataGrid
                    rows={loads} 
                    columns={columns} 
                    getRowId={(row) => row.kuormaId} 
                    loading={isLoading}
                    initialState={{ pagination: { paginationModel: { page: 0, pageSize: 25 } } }}
                    pageSizeOptions={[10, 25, 50, 100]} 
                    disableRowSelectionOnClick
                    columnVisibilityModel={{ kuormaId: false }}
                    sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }, '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold', textTransform: 'uppercase' } }}
                />
            </Paper>

            {isModalOpen && ( 
                <LoadFormModal 
                    open={isModalOpen} 
                    onCloseAction={handleCloseModal} // Use the prop name expected by the modal
                    onSaveSuccessAction={handleSaveSuccess} // Use the prop name expected by the modal
                    initialData={selectedLoadForEditing} 
                /> 
            )}


            <ConfirmationDialog 
                open={!!deleteConfirmation} 
                onClose={() => setDeleteConfirmation(null)} 
                onConfirm={handleConfirmDelete} 
                title="Confirm Load Deletion" 
                message={`Are you sure you want to delete Load #${deleteConfirmation?.kuormaId} from customer "${deleteConfirmation?.asiakkaanNimi}"? This will mark it as inactive.`} 
                isConfirming={isDeleting}
            />
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}