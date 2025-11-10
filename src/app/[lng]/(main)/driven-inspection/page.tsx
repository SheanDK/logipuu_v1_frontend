// frontend/src/app/(main)/driven-inspection/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { useTranslation } from '@/i18n/useTranslation';
import axios from 'axios';

import { fetchLoadsForInspection } from '@/services/loadService';
import { 
    ILoadListItem, 
    IDrivenInspectionFilters, 
    IClientBasicInfo, 
    IVehicleBasicInfo, 
    IPuutavaraItem 
} from '@/types'; 
import TableSkeletonLoader from '@/components/common/TableSkeletonLoader';
import InspectionFilterBar from '@/components/driven-inspection/InspectionFilterBar';
import EditDrivenInspectionModal from '@/components/driven-inspection/EditDrivenInspectionModal';

// Mock data
const mockClients: IClientBasicInfo[] = [];
const mockVehicles: IVehicleBasicInfo[] = [];
const mockTimberTypes: IPuutavaraItem[] = [];

export default function DrivenInspectionPage() {
    const { t } = useTranslation('drivenInspection');
    const { enqueueSnackbar } = useSnackbar();

    const [loads, setLoads] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<Partial<IDrivenInspectionFilters>>({}); 
    const [editingLoad, setEditingLoad] = useState<ILoadListItem | null>(null);

    const loadDataForInspection = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchLoadsForInspection();
            setLoads(data);
        } catch (error: unknown) {
            let message = t('toasts.loadError');
            if (axios.isAxiosError(error) && error.response) {
                message = error.response.data.message || message;
            }
            enqueueSnackbar(message, { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [enqueueSnackbar, t]);

    useEffect(() => {
        loadDataForInspection();
    }, [loadDataForInspection]);

    // Define columns with proper typing
    const columns: GridColDef<ILoadListItem>[] = useMemo(() => [
        { 
            field: 'date', 
            headerName: 'Date', 
            width: 120,
            renderCell: (params) => params.row.date || 'N/A'
        },
        { 
            field: 'autoNro', 
            headerName: 'Vehicle', 
            width: 120 
        },
        { 
            field: 'driverName', 
            headerName: 'Driver', 
            flex: 1 
        },
        { 
            field: 'customerName', 
            headerName: 'Customer', 
            flex: 1 
        },
        { 
            field: 'drivingOrderNo', 
            headerName: 'Order No.', 
            width: 130 
        },
        { 
            field: 'cubicMeters', 
            headerName: 'm³', 
            width: 90,
            renderCell: (params) => (params.row.cubicMeters || 0).toFixed(2)
        },
    ], []);

    // --- FIX: Memoize the handler to ensure it remains stable across renders ---
    const handleFilterChange = useCallback((
        name: keyof IDrivenInspectionFilters, 
        value: IDrivenInspectionFilters[keyof IDrivenInspectionFilters]
    ) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    if (isLoading && loads.length === 0) {
        return <TableSkeletonLoader />;
    }

    return (
        <Box sx={{ p: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
                {t('title')}
            </Typography>

            <InspectionFilterBar 
                filters={filters}
                onFilterChangeAction={handleFilterChange}
                clientList={mockClients} 
                vehicleList={mockVehicles}
                timberTypeList={mockTimberTypes}
            />

            <Paper sx={{ flex: 1, mt: 2, overflow: 'hidden' }}>
                <DataGrid
                    loading={isLoading}
                    rows={loads}
                    columns={columns}
                    getRowId={(row: ILoadListItem) => row.kuormaId || Math.random()}
                    onRowClick={(params: GridRowParams<ILoadListItem>) => setEditingLoad(params.row)}
                    sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' }, border: 0 }}
                />
            </Paper>

            {/* Modal now accepts ILoadListItem correctly */}
            {editingLoad && (
                <EditDrivenInspectionModal
                    open={!!editingLoad}
                    onClose={() => setEditingLoad(null)}
                    initialData={editingLoad} 
                    onSaveSuccess={() => {
                        setEditingLoad(null);
                        loadDataForInspection();
                    }}
                />
            )}
        </Box>
    );
}