// frontend/src/app/(main)/driven-inspection/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, IconButton, Tooltip, Button } from '@mui/material';
import { DataGrid, GridColDef, GridToolbarContainer, GridToolbarColumnsButton } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { useSnackbar } from 'notistack';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { IDrivenInspectionListItem, IClientBasicInfo, IVehicleBasicInfo, IPuutavaraItem, IDrivenInspectionFilters, IVehicleBackendResponse } from '@/types';
import { fetchDrivenInspectionList, acceptDrivenInspectionEntries } from '@/services/drivenInspectionService';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllClients } from '@/services/clientService';
import { fetchAllVehicles } from '@/services/vehicleService'; // Use the raw fetcher
import { fetchAllWoodTypes } from '@/services/timberStackService';

import InspectionFilterBar from '@/components/driven-inspection/InspectionFilterBar';
const EditInspectionModal = dynamic(() => import('@/components/driven-inspection/EditDrivenInspectionModal'), { ssr: false });

export default function DrivenInspectionPage() {
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();
    const [rows, setRows] = useState<IDrivenInspectionListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acceptedRows, setAcceptedRows] = useState<Set<number>>(new Set());
    
    const [filters, setFilters] = useState<Partial<IDrivenInspectionFilters>>({
        startDate: dayjs().subtract(1, 'month'),
        endDate: dayjs(),
    });
    
    const [dropdownData, setDropdownData] = useState({
        clientList: [] as IClientBasicInfo[],
        vehicleList: [] as IVehicleBasicInfo[],
        timberTypeList: [] as IPuutavaraItem[],
    });

    const [editingRow, setEditingRow] = useState<IDrivenInspectionListItem | null>(null);

    const canAccept = useMemo(() => user?.permissions?.includes('driven & inspection_accept'), [user]);
    const canEdit = useMemo(() => user?.permissions?.includes('driven & inspection_edit'), [user]);
    const canDelete = useMemo(() => user?.permissions?.includes('driven & inspection_delete'), [user]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchDrivenInspectionList(filters);
            setRows(data);
        } catch (err) {
            setError('Failed to load data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => { loadData(); }, [loadData]);
    
    useEffect(() => {
    const loadFilterData = async () => {
        try {
            const [clientData, vehicleData, timberTypeData] = await Promise.all([
                fetchAllClients(),
                fetchAllVehicles(), // Use the raw fetcher that returns IVehicleBackendResponse[]
                fetchAllWoodTypes(),
            ]);
            const transformedClients: IClientBasicInfo[] = clientData.map(c => ({ 
                id: String(c.asiakkaanId), 
                name: c.asiakkaanNimi, 
                clientId: String(c.asiakkaanId), 
                clientName: c.asiakkaanNimi, 
                targetColor: null 
            }));

            // --- CORRECT & SIMPLIFIED TRANSFORMATION ---
            // Map from IVehicleBackendResponse to the simplified IVehicleBasicInfo
            const transformedVehicles: IVehicleBasicInfo[] = vehicleData.map((v: IVehicleBackendResponse) => ({
                id: String(v.kalustoNro),
                registrationNo: v.rekNro,
                // These are not needed for the filter bar but are required by the type
                name: `${v.kalustoNro} - ${v.rekNro}`,
                vehicleNo: String(v.kalustoNro),
            }));

            setDropdownData({ 
                clientList: transformedClients, 
                vehicleList: transformedVehicles, 
                timberTypeList: timberTypeData 
            });
        } catch (error) {
            console.error("Failed to load filter data", error);
            setError("Could not load filter options.");
        }
    };
    loadFilterData();
}, []);

    const handleFilterChange = (filterName: keyof IDrivenInspectionFilters, value: any) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const handleToggleAccept = (rowId: number) => {
        setAcceptedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowId)) newSet.delete(rowId);
            else newSet.add(rowId);
            return newSet;
        });
    };
    
     const handleAcceptClick = async () => {
        if (acceptedRows.size === 0 || !canAccept) return;
        
        try {
            const result = await acceptDrivenInspectionEntries(Array.from(acceptedRows));
            enqueueSnackbar(result.message || 'Entries accepted successfully!', { variant: 'success' });
            setAcceptedRows(new Set());
            await loadData();
        } catch (error: any) {
            console.error("Failed to accept entries", error);
            enqueueSnackbar(error?.response?.data?.message || 'Failed to accept entries.', { variant: 'error' });
        }
    };

    const handleEditClick = (row: IDrivenInspectionListItem) => { setEditingRow(row); };
    
    const columns: GridColDef<IDrivenInspectionListItem>[] = useMemo(() => [
        {
            field: 'select', headerName: 'Accept', width: 80, sortable: false, align: 'center', headerAlign: 'center',
            renderCell: (params) => {
                const isAccepted = acceptedRows.has(params.row.puutavaraId);
                return (
                    <Tooltip title={isAccepted ? "Remove" : "Add"}>
                        <IconButton onClick={() => handleToggleAccept(params.row.puutavaraId)} color={isAccepted ? "secondary" : "primary"} size="small">
                            {isAccepted ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
                        </IconButton>
                    </Tooltip>
                );
            }
        },
        { 
            field: 'date', 
            headerName: 'Date', 
            width: 110, 
            valueFormatter: ({ value }) => {
                // This logic is correct as backend sends 'YYYY-MM-DD'
                if (!value) return ''; 
                return dayjs(value).format('DD.MM.YYYY');
            }
        },
        { field: 'drivingOrderNo', headerName: 'Driving Order No.', width: 150 },
        { field: 'receptionNo', headerName: 'Reception No.', width: 130, editable: canEdit },
        { field: 'autoNro', headerName: 'Auto Nr', width: 100 },
        { field: 'driverName', headerName: 'Driver', width: 150 },
        { field: 'puulaaniName', headerName: 'Puulaani', width: 180 },
        { field: 'customerName', headerName: 'Customer', width: 180 },
        { field: 'timberTypes', headerName: 'Timber', width: 150 },
        { field: 'drivingRoute', headerName: 'Driving route', width: 180, editable: canEdit },
        { field: 'cubicMeters', headerName: 'Cubic metres (m³)', type: 'number', width: 130, align: 'right', headerAlign: 'right', editable: canEdit },
        { field: 'freightKm', headerName: 'Freight (km)', type: 'number', width: 110, align: 'right', headerAlign: 'right', editable: canEdit },
        { field: 'hours', headerName: 'Hours', type: 'number', width: 80, align: 'right', headerAlign: 'right', editable: canEdit },
        { field: 'pcs', headerName: 'Pcs', type: 'number', width: 80, align: 'right', headerAlign: 'right', editable: canEdit },
        { field: 'additionalInformation', headerName: 'Additional information', width: 250, editable: canEdit },
        {
            field: 'actions', headerName: 'Action', width: 100, sortable: false, align: 'center', headerAlign: 'center',
            renderCell: (params) => (
                <Box>
                    {canEdit && <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditClick(params.row)}><EditIcon /></IconButton></Tooltip>}
                    {canDelete && <Tooltip title="Delete"><IconButton size="small" color="error"><DeleteIcon /></IconButton></Tooltip>}
                </Box>
            ),
        },
    ], [canEdit, canDelete, acceptedRows, handleToggleAccept]);

    function CustomToolbar() {
        return (
            <GridToolbarContainer sx={{ justifyContent: 'flex-end' }}>
                <GridToolbarColumnsButton />
            </GridToolbarContainer>
        );
    }

    return (
        <>
            <Box sx={{ p: 3, m: -3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 2, flexShrink: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>Driven / Inspection</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button 
                                variant="contained" 
                                color="success" 
                                startIcon={<CheckCircleIcon />} 
                                disabled={!canAccept || acceptedRows.size === 0}
                                onClick={handleAcceptClick}
                            >
                                Accept ({acceptedRows.size})
                            </Button>
                            <Button variant="outlined" startIcon={<PictureAsPdfIcon />}>Report</Button>
                        </Box>
                    </Box>
                    
                    <InspectionFilterBar
                        filters={filters}
                        onFilterChangeAction={handleFilterChange}
                        clientList={dropdownData.clientList}
                        vehicleList={dropdownData.vehicleList}
                        timberTypeList={dropdownData.timberTypeList}
                    />
                </Paper>

                {error && <Alert severity="error" sx={{ flexShrink: 0 }}>{error}</Alert>}

                <Paper sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={isLoading}
                    getRowId={(row: IDrivenInspectionListItem) => row.puutavaraId}
                    slots={{ toolbar: CustomToolbar }}
                    sx={{
                        border: 'none',
                        // Style for the entire header row container (for background color)
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f0f2f5',
                        },
                        // --- THIS IS THE FIX ---
                        // Style for the specific title text within each header
                        '& .MuiDataGrid-columnHeaderTitle': {
                            fontWeight: 'bold', // Apply bold font weight directly to the title
                            color: 'text.primary',
                            textTransform: 'uppercase',
                        },
                    }}
                />
            </Paper>
            </Box>
            
            {editingRow && (
    <EditInspectionModal
        open={!!editingRow}
        initialData={editingRow}
        onClose={() => setEditingRow(null)}
        onSaveSuccess={(savedKuormaData) => {
            // Check if we received valid data from the backend
            if (!savedKuormaData) {
                enqueueSnackbar('Failed to save: No response from server.', { variant: 'error' });
                return;
            }

            const isNew = !editingRow?.kuormaId;

            setRows(prevRows => 
                prevRows.map(row => {
                    // Find the row we were editing using its stable puutavaraId
                    if (row.puutavaraId === editingRow.puutavaraId) {
                        // --- ROBUST FIX: Manually merge the new kuorma data ---
                        // This preserves all the original JOINed data (like puulaaniName, etc.)
                        // and only updates the fields that come from the 'kuorma' table.
                        return {
                            ...row,
                            kuormaId: savedKuormaData.kuormaId,
                            receptionNo: savedKuormaData.receptionNo,
                            drivingRoute: savedKuormaData.drivingRoute,
                            cubicMeters: savedKuormaData.m3,
                            freightKm: savedKuormaData.km,
                            hours: savedKuormaData.tunnit,
                            pcs: savedKuormaData.kpl,
                            additionalInformation: savedKuormaData.additionalInfo,
                            date: savedKuormaData.pvm ? dayjs(savedKuormaData.pvm).format('YYYY-MM-DD') : row.date,
                        };
                    }
                    return row;
                })
                        );

                        setEditingRow(null); // Close the modal
                        
                        // --- FIX: This will now execute correctly ---
                        enqueueSnackbar(
                            isNew ? 'New entry created successfully!' : 'Entry updated successfully!',
                            { variant: 'success' }
                        );
                    }}
                />
            )}
        </>
    );
}