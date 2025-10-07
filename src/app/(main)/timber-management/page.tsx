// frontend/src/app/(main)/timber-management/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, IconButton, Tooltip, Button, Snackbar, AlertColor } from '@mui/material';
import { DataGrid, GridColDef, GridFooterContainer, GridFooter, GridValueFormatter } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';

// --- FIX 1: Import missing icons ---
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Update the import path below to the correct location of your AuthContext file
// Update the import path below to the correct location of your AuthContext file
import { useAuth } from '../../../contexts/AuthContext';
// --- FIX 2: Correct import path for Filter Bar ---
// Update the path below to the correct relative path for PuulaaniFilterBar
import PuulaaniFilterBar from '../../../components/timber-management/dialogs/PuulaaniFilterBar';

// --- FIX 3: Import all necessary types ---
import { ITimberStackListItem, ITimberStackListFilters, IMapTimberStack, IEditablePuulaani, IClientBasicInfo, IBackendClient, IVehicleBasicInfo, IPuutavaraItem, PendingPuulaaniData } from '../../../types';
import { fetchTimberStackList, deleteTimberStack, getTimberStackFullDetails } from '../../../services/timberStackService';
import { fetchAllClients } from '../../../services/clientService'; 
import { fetchVehiclesListApi } from '../../../services/vehicleService'; 
import { fetchAllWoodTypes } from '../../../services/timberStackService'; // Assuming this is the correct service name

const PuulaaniDetailsModal = dynamic(() => import('../../../components/map/dialogs/PuulaaniDetailsModal'), { ssr: false });
// --- FIX 4: Correct import path for AddPuulaaniModal ---
const AddPuulaaniModal = dynamic(() => import('../../../components/timber-management/dialogs/AddPuulaaniModal'), { ssr: false });
// Update the import path below to the correct location of ConfirmationDialog
// Update the import path below to the correct location of ConfirmationDialog
// import ConfirmationDialog from '../../../components/dialogs/ConfirmationDialog';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

function CustomFooter({ rows }: { rows: ITimberStackListItem[] }) {
    const { totalKok, totalJaljella } = useMemo(() => {
        return rows.reduce((acc, row) => {
            acc.totalKok += parseFloat(String(row.kok)) || 0;
            acc.totalJaljella += parseFloat(String(row.jaljella)) || 0;
            return acc;
        }, { totalKok: 0, totalJaljella: 0 });
    }, [rows]);

    return (
        <Box sx={{ width: '100%' }}>
            <GridFooterContainer 
            sx={(theme) => ({ 
                 position: 'sticky',
                borderTop: '1px solid rgba(224, 224, 224, 1)', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                px: 2, 
                bgcolor: 'background.paper',
               })}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 4 }}>Altogether</Typography>
                <Box sx={{ width: 120, textAlign: 'right' }}><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{totalKok.toFixed(2)}</Typography></Box>
                <Box sx={{ width: 120, textAlign: 'right' }}><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{totalJaljella.toFixed(2)}</Typography></Box>
                <Box sx={{ width: 120 }} /> 
            </GridFooterContainer>
            <GridFooter />
        </Box>
    );
}

export default function PuulaaniListPage() {
    const { user } = useAuth();
    const canCreate = useMemo(() => user?.permissions?.includes('timber management_create'), [user]);
    const canEdit = useMemo(() => user?.permissions?.includes('timber management_edit'), [user]);
    const canDelete = useMemo(() => user?.permissions?.includes('timber management_delete'), [user]);

    const [rows, setRows] = useState<ITimberStackListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ITimberStackListFilters>({ status: 'active' });
    
    const [filterData, setFilterData] = useState<{
        clientList: IClientBasicInfo[],
        vehicleList: IVehicleBasicInfo[],
        timberTypeList: IPuutavaraItem[]
    }>({ clientList: [], vehicleList: [], timberTypeList: [] });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [puulaaniForEdit, setPuulaaniForEdit] = useState<IEditablePuulaani | null>(null);
    const [pendingPuulaaniData, setPendingPuulaaniData] = useState<Partial<PendingPuulaaniData> | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<ITimberStackListItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: AlertColor }>({ open: false, message: '', severity: 'info' });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [puulaaniData, clientData, vehicleData, timberTypeData] = await Promise.all([
                fetchTimberStackList(filters),
                fetchAllClients(),
                fetchVehiclesListApi(),
                fetchAllWoodTypes()
            ]);
            
            setRows(puulaaniData);

            const transformedClients: IClientBasicInfo[] = clientData.map((client: { asiakkaanId: any; asiakkaanNimi: any; kohteenVari: any; }) => ({
                id: String(client.asiakkaanId),
                name: client.asiakkaanNimi,
                clientId: String(client.asiakkaanId),
                clientName: client.asiakkaanNimi,
                targetColor: client.kohteenVari || null,
            }));
            
            const transformedVehicles: IVehicleBasicInfo[] = vehicleData.map((v: any) => ({
                ...v,
                id: String(v.id),
                name: v.name || v.vehicleName || '', // Adjust property names as per your API response
                vehicleNo: v.vehicleNo || '',
                registrationNo: v.registrationNo || ''
            }));

            setFilterData({
                clientList: transformedClients,
                vehicleList: transformedVehicles,
                timberTypeList: timberTypeData
            });

        } catch (err) {
            setError('Failed to load page data. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFilterChange = (name: keyof ITimberStackListFilters, value: string | null) => {
        setFilters((prevFilters: any) => ({ ...prevFilters, [name]: value }));
    };

    const handleNewClick = () => { setIsAddModalOpen(true); };

    const handleGoToFinalizeStep = (data: Partial<PendingPuulaaniData>) => {
        setPendingPuulaaniData(data);
        setIsAddModalOpen(false);
        setIsEditModalOpen(true);
    };

    const handleDetailsModalClose = () => {
        setIsEditModalOpen(false);
        setPuulaaniForEdit(null);
        setPendingPuulaaniData(null);
    };
    
    const handleSaveSuccess = () => {
        handleDetailsModalClose();
        loadData();
        setSnackbar({ open: true, message: 'Puulaani saved successfully!', severity: 'success' });
    };

    const handleEditClick = async (puulaaniListItem: ITimberStackListItem) => {
        try {
            const fullDetails = await getTimberStackFullDetails(puulaaniListItem.puulaaniId);
            if (fullDetails && fullDetails.puulaani) {
                const rawPuulaani = fullDetails.puulaani;
                const client = filterData.clientList.find(c => c.id === String(rawPuulaani.asiakasId)) || { name: 'Unknown Client', targetColor: '#808080' };
                
                const puulaaniDataForModal: IEditablePuulaani = {
                    id: rawPuulaani.puulaaniId,
                    clientId: rawPuulaani.asiakasId,
                    clientName: client.name,
                    clientColor: client.targetColor,
                    name: rawPuulaani.nimi,
                    latitude: Number(rawPuulaani.sijaintiLat),
                    longitude: Number(rawPuulaani.sijaintiLong),
                    totalVolume: Number(rawPuulaani.kok),
                    remainingVolume: Number(rawPuulaani.jaljella),
                    isActive: rawPuulaani.aktiivinen,
                    isCompleted: rawPuulaani.valmis,
                    date: rawPuulaani.pvm,
                    dispatchOrderNo: rawPuulaani.ajomaaraysnro,
                    additionalInfo: rawPuulaani.lisatiedot,
                    autot: fullDetails.autot,
                    puutavarat: fullDetails.puutavarat,
                };
                
                setPuulaaniForEdit(puulaaniDataForModal);
                setIsEditModalOpen(true);
            } else {
                setSnackbar({ open: true, message: "Could not find full details for this Puulaani.", severity: 'warning' });
            }
        } catch (e) {
            setSnackbar({ open: true, message: "Failed to load Puulaani details for editing.", severity: 'error' });
        }
    };

    const handleDeleteClick = (puulaani: ITimberStackListItem) => { setDeleteTarget(puulaani); };
    
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsSaving(true);
        try {
            await deleteTimberStack(deleteTarget.puulaaniId);
            setSnackbar({ open: true, message: `Puulaani '${deleteTarget.nimi}' deleted successfully.`, severity: 'success' });
            setDeleteTarget(null);
            loadData();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete Puulaani.', severity: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const columns: GridColDef[] = useMemo(() => {
        const baseColumns: GridColDef[] = [
            { field: 'puulaaniId', headerName: 'Puulaani ID', width: 90, hideable: false, },
            { 
                field: 'pvm', 
                headerName: 'Date', 
                width: 120, 
                renderCell: (params) => (
                    <Typography variant="body2" sx={{height: '100%', width: '100%', display: 'flex', alignItems: 'center' }}>
                        {params.value ? dayjs(params.value).format('DD.MM.YYYY') : ''}
                    </Typography>
                )
            },
            { field: 'asiakkaanNimi', headerName: 'Customer', flex: 1, minWidth: 200 },
            { field: 'nimi', headerName: 'Object Name', flex: 1, minWidth: 200 },
            { 
                field: 'kok', 
                headerName: 'Size (m³)', 
                type: 'number', 
                width: 120, 
                align: 'right', 
                headerAlign: 'right', 
                // --- THIS IS THE FIX ---
                renderCell: (params) => {
                    const numValue = parseFloat(params.value); // Value can be a string from the API
                    return (
                        <Typography variant="body2" sx={{height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {!isNaN(numValue) ? numValue.toFixed(2) : '0.00'}
                        </Typography>
                    );
                }
            },
            { 
                field: 'jaljella', 
                headerName: 'Left (m³)', 
                type: 'number', 
                width: 120, 
                align: 'right', 
                headerAlign: 'right', 
                // --- THIS IS THE FIX ---
                renderCell: (params) => {
                    const numValue = parseFloat(params.value); // Value can be a string from the API
                    return (
                        <Typography variant="body2" sx={{height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {!isNaN(numValue) ? numValue.toFixed(2) : '0.00'}
                        </Typography>
                    );
                }
            },
        ];

        if (canEdit || canDelete) {
            baseColumns.push({
                field: 'actions',
                headerName: 'Actions',
                width: 120,
                sortable: false,
                filterable: false,
                align: 'center',
                headerAlign: 'center',
                renderCell: (params) => (
                    <Box>
                        {canEdit && (
                            <Tooltip title="Edit Puulaani">
                                <IconButton onClick={() => handleEditClick(params.row)} size="small"><EditIcon /></IconButton>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip title="Delete Puulaani">
                                <IconButton onClick={() => handleDeleteClick(params.row)} size="small" color="error"><DeleteIcon /></IconButton>
                            </Tooltip>
                        )}
                    </Box>
                ),
            });
        }
        return baseColumns;
    }, [canEdit, canDelete, handleEditClick, handleDeleteClick]);

    return (
        <Box sx={{ p: 3, m: -3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: 2}}>
            <Paper sx={{ p: 2, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>Timber Management</Typography>
                    {canCreate && ( <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleNewClick}>New Puulaani</Button> )}
                </Box>
                <PuulaaniFilterBar 
                    filters={filters}
                    onFilterChangeAction={handleFilterChange}
                    clientList={filterData.clientList}
                    vehicleList={filterData.vehicleList}
                    timberTypeList={filterData.timberTypeList}
                />
            </Paper>

            {error && <Alert severity="error" sx={{ flexShrink: 0 }}>{error}</Alert>}
            
            <Box sx={{ flexGrow: 1, width: '100%', backgroundColor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={isLoading}
                    getRowId={(row) => row.puulaaniId}
                    columnVisibilityModel={{
                        puulaaniId: false,
                        }}
                    initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    slots={{ footer: () => <CustomFooter rows={rows} /> }}
                    sx={{
    height: '100%',
    border: 'none', // Remove the default border
    // Style for the column headers container
    '& .MuiDataGrid-columnHeaders': {
        backgroundColor: (theme) => theme.palette.grey[200], // A slightly darker grey
        borderBottom: '1px solid',
        borderColor: 'divider',
    },
    // Style for the text inside each header cell
    '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 600, // Make it bold
        textTransform: 'uppercase', // All caps for a professional look
        fontSize: '0.75rem', // Slightly smaller font for uppercase text
        letterSpacing: '0.5px', // Add some space between letters
    },
    // Style for individual cells
    '& .MuiDataGrid-cell': {
        borderBottom: '1px solid',
        borderColor: 'grey.200', // A light border for rows
        alignItems: 'center'
    },
    // Hover effect for rows
    '& .MuiDataGrid-row:hover': {
        backgroundColor: 'action.hover'
    },
    // Ensure no double border with our custom footer
    '& .MuiDataGrid-footerContainer': {
        borderTop: 'none',
    },
}}
                    //sx={{ height: '100%', border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f9fafb' }, '& .MuiDataGrid-footerContainer': { borderTop: 'none' } }}
                />
            </Box>

            <AddPuulaaniModal
                open={isAddModalOpen}
                onCloseAction={() => setIsAddModalOpen(false)}
                onNextAction={handleGoToFinalizeStep}
                clientList={filterData.clientList}
            />
            
            <PuulaaniDetailsModal
                open={isEditModalOpen}
                onCloseAction={handleDetailsModalClose}
                onSaveSuccessAction={handleSaveSuccess}
                initialData={puulaaniForEdit || pendingPuulaaniData}
                clientList={filterData.clientList}
                showMap={true}
            />
            
            <ConfirmationDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Confirm Puulaani Deletion" message={`Are you sure you want to delete Puulaani "${deleteTarget?.nimi}"?`} isConfirming={isSaving}/>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}