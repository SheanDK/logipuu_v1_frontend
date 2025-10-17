// frontend/src/components/drivers/ConsignmentDriverDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { getDriverConsignments } from '@/services/consignmentDriverService';
import { IConsignmentKuormaListItem } from '@/types';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import TableSkeletonLoader from '@/components/common/TableSkeletonLoader';
import CustomNoRowsOverlay from '@/components/common/CustomNoRowsOverlay';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useTranslation } from '@/i18n/useTranslation';

interface ConsignmentDashboardProps {
    onBackAction: () => void;
    onNavigateToFormAction: (id: number | null) => void;
}

// FIX: Added the onBackAction prop back to the function signature
export default function ConsignmentDriverDashboard({ onBackAction, onNavigateToFormAction }: ConsignmentDashboardProps) {
    const { selectedVehicleId } = useDriverSession();
    const [consignments, setConsignments] = useState<IConsignmentKuormaListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation(['consignmentDriver']);

    const fetchConsignments = useCallback(async () => {
        if (!selectedVehicleId) return;
        setIsLoading(true);
        setError(null); // Reset error on new fetch
        try {
            const data = await getDriverConsignments(selectedVehicleId);
            setConsignments(data);
        } catch (err) {
            setError(t('errors.loadFailed', { ns: 'consignmentDriver' }));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedVehicleId]);

    useEffect(() => {
        fetchConsignments();
    }, [fetchConsignments]);

    const columns = useMemo(
        (): GridColDef[] => [
            { field: 'asiakkaanNimi', headerName: t('customer', { ns: 'consignmentDriver' }), flex: 2 },
            {
                field: 'pvm',
                headerName: t('date', { ns: 'consignmentDriver' }),
                flex: 1,
                type: 'date',
                valueGetter: (value) => new Date(value),
            },
            { field: 'autoNro', headerName: t('vehicle', { ns: 'consignmentDriver' }), flex: 1 },
            { field: 'kuljettajanNimi', headerName: t('driver', { ns: 'consignmentDriver' }), flex: 1.5 },
        ],
        [t]
    );

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
    }

    if (error) {
        // Pass the error message and the fetch function to the new component.
        return <ErrorDisplay message={error} onRetry={fetchConsignments} />;
    }

    return (
        // FIX: Changed layout to fit within the main application area instead of 100vh
        <Box sx={{ p: { xs: 1, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* FIX: Added a header section for the title and buttons */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" component="h1">{t('title', { ns: 'consignmentDriver' })}</Typography>
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => onNavigateToFormAction(null)}>
                        {t('buttons.newConsignment', { ns: 'consignmentDriver' })}
                    </Button>
                    <Button startIcon={<ArrowBackIcon />} onClick={onBackAction}>
                        {t('buttons.changeMode', { ns: 'consignmentDriver' })}
                    </Button>
                </Stack>
            </Stack>

            {/* The table */}
            <Paper sx={{ flexGrow: 1, height: '100%' }}>

                {isLoading ? (
                    <TableSkeletonLoader rows={8} />
                ) : (
                    <DataGrid
                        rows={consignments}
                        columns={columns}
                        getRowId={(row) => row.kuormaId}
                        onRowClick={(params) => onNavigateToFormAction(params.row.kuormaId)}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 25 },
                            },
                            sorting: {
                                sortModel: [{ field: 'pvm', sort: 'desc' }], // Default sort by date descending
                            },
                        }}
                        pageSizeOptions={[10, 25, 50]}
                        disableRowSelectionOnClick
                        sx={{

                            // Target the column header class to apply bold font weight.
                            '& .MuiDataGrid-columnHeaderTitle': {
                                fontWeight: 'bold',
                            },
                            '& .MuiDataGrid-row:hover': {
                                cursor: 'pointer',
                            },
                        }}
                        slots={{
                            noRowsOverlay: () => <CustomNoRowsOverlay message={t('noRowsSelectedVehicle', { ns: 'consignmentDriver' })} />
                        }}
                    />
                )}
            </Paper>
        </Box>
    );
}