// frontend/src/components/drivers/ConsignmentDriverDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, Stack, Tooltip, Fab, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { getDriverConsignments } from '@/services/consignmentDriverService';
import { IConsignmentKuormaListItem } from '@/types';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import TableSkeletonLoader from '@/components/common/TableSkeletonLoader';
import CustomNoRowsOverlay from '@/components/common/CustomNoRowsOverlay';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useTranslation } from '@/i18n/useTranslation';
import dayjs from 'dayjs';
import i18n from '@/i18n/i18n';

interface ConsignmentDashboardProps {
    onBackAction: () => void;
    onNavigateToFormAction: (id: number | null) => void;
}

export default function ConsignmentDriverDashboard({ onBackAction, onNavigateToFormAction }: ConsignmentDashboardProps) {
    const { selectedVehicleId } = useDriverSession();
    const [consignments, setConsignments] = useState<IConsignmentKuormaListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation(['consignmentDriver']);

    const fetchConsignments = useCallback(async () => {
        if (!selectedVehicleId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await getDriverConsignments(selectedVehicleId);
            setConsignments(data);
        } catch (err) {
            setError(t('errors.loadFailed', { ns: 'consignmentDriver' }));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedVehicleId, t]);

    useEffect(() => {
        fetchConsignments();
    }, [fetchConsignments]);

    // --- FIX: Removed 'flex' and added 'width' to compact columns to the left ---
    const columns = useMemo(
        (): GridColDef[] => [
            {
                field: 'pvm',
                headerName: t('date', { ns: 'consignmentDriver' }),
                width: 150, // Fixed width
                type: 'date',
                valueGetter: (value) => new Date(value),
                renderCell: (params) => (
                    <span style={{ fontWeight: '500', fontSize: '1rem' }}>
                        {dayjs(params.value).locale(i18n.language).format('L')}
                    </span>
                )
            },
            {
                field: 'waybillCount',
                headerName: t('waybills', { ns: 'consignmentDriver', defaultValue: 'Waybills' }),
                width: 120, // Fixed width
                align: 'center',
                headerAlign: 'center',
                renderCell: (params) => (
                    <Chip
                        icon={<DescriptionIcon style={{ fontSize: '1rem' }} />}
                        label={params.value}
                        size="small"
                        variant="outlined"
                        color="primary"
                    />
                )
            },
            {
                field: 'totalM3',
                headerName: t('totalM3', { ns: 'consignmentDriver', defaultValue: 'Total m3' }),
                width: 150, // Fixed width
                align: 'right',
                headerAlign: 'right',
                valueFormatter: (value: any) => {
                    if (value == null) return '';
                    return Number(value).toFixed(2);
                },
                renderCell: (params) => (
                    <strong>{Number(params.value || 0).toFixed(2)}</strong>
                )
            },
            {
                field: 'status',
                headerName: t('status', { ns: 'consignmentDriver', defaultValue: 'Status' }),
                width: 150, // Fixed width
                align: 'center',
                headerAlign: 'center',
                renderCell: (params) => (
                    <Chip
                        label={params.value || 'Completed'}
                        color={params.value === 'Completed' ? 'success' : 'default'}
                        size="small"
                    />
                )
            }
        ],
        [t]
    );

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <ErrorDisplay message={error} onRetry={fetchConsignments} />;
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                sx={{ flexShrink: 0 }}
            >
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                    {t('title')}
                </Typography>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => onNavigateToFormAction(null)}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        {t('buttons.newConsignment')}
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={onBackAction}
                    >
                        {t('buttons.changeMode')}
                    </Button>
                </Stack>
            </Stack>

            <Paper sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                {isLoading ? (
                    <TableSkeletonLoader rows={10} />
                ) : (
                    <DataGrid
                        rows={consignments}
                        columns={columns}
                        getRowId={(row) => row.kuormaId}
                        onRowClick={(params) => onNavigateToFormAction(params.row.kuormaId)}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 25 } },
                            sorting: { sortModel: [{ field: 'pvm', sort: 'desc' }] },
                        }}
                        pageSizeOptions={[10, 25, 50]}
                        disableRowSelectionOnClick
                        sx={{
                            border: 0,
                            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' },
                            '& .MuiDataGrid-row:hover': { cursor: 'pointer', backgroundColor: '#f5f5f5' },
                        }}
                        slots={{
                            noRowsOverlay: () => <CustomNoRowsOverlay message={t('noRowsSelectedVehicle')} />
                        }}
                    />
                )}
            </Paper>

            <Tooltip title={t('buttons.newConsignment')}>
                <Fab
                    color="primary"
                    aria-label="add consignment"
                    onClick={() => onNavigateToFormAction(null)}
                    sx={{
                        position: 'absolute',
                        bottom: 15,
                        left: '45%',
                        transform: 'translateX(-55%)',
                        display: { xs: 'flex', sm: 'none' }
                    }}
                >
                    <AddIcon />
                </Fab>
            </Tooltip>
        </Box>
    );
}