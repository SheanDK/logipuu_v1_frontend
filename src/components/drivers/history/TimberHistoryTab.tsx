// frontend/src/components/drivers/history/TimberHistoryTab.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRowParams } from '@mui/x-data-grid';
import { useTranslation } from '@/i18n/useTranslation';
import { fetchMyCompletedLoads } from '@/services/loadService';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Box, Chip, useTheme, alpha } from '@mui/material';
import TableSkeletonLoader from '@/components/common/TableSkeletonLoader';
import CustomNoRowsOverlay from '@/components/common/CustomNoRowsOverlay';
import i18n from '@/i18n/i18n';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface TimberHistoryTabProps {
    filters: { searchQuery: string; customer: string | null; startDate: string; endDate: string; };
    onRowClick?: (id: number, data?: any) => void;
}

const TimberHistoryTab: React.FC<TimberHistoryTabProps> = ({ filters, onRowClick }) => {
    const { t } = useTranslation(['completedTrips', 'common']);
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchMyCompletedLoads();
            const timber = data.filter((trip: any) => trip.tyyppi === 'Timber Load' || Number(trip.tyyppi) === 0);
            const mapped = timber.map((r: any) => ({ ...r, id: r.kuormaId }));

            const filtered = mapped.filter(item => {
                const itemDate = dayjs(item.pvm);

                const isWithinDate = itemDate.isSameOrAfter(filters.startDate, 'day') &&
                    itemDate.isSameOrBefore(filters.endDate, 'day');

                const matchesSearch = !filters.searchQuery ||
                    item.asiakkaanNimi.toLowerCase().includes(filters.searchQuery.toLowerCase());

                const matchesCustomer = !filters.customer || item.asiakkaanNimi === filters.customer;

                return isWithinDate && matchesSearch && matchesCustomer;
            });

            setRows(filtered);
        } catch (err) { console.error(t('common:error'), err); }
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { loadData(); }, [loadData]);

    const columns: GridColDef[] = [
        { field: 'pvm', headerName: t('completedTrips:date').toUpperCase(), width: 110, renderCell: (p) => dayjs(p.value).format(t('completedTrips:dateFormat')) },
        { field: 'asiakkaanNimi', headerName: t('completedTrips:customer').toUpperCase(), width: 220 },
        { field: 'lahto', headerName: t('completedTrips:origin').toUpperCase(), width: 180 },
        { field: 'kohde', headerName: t('completedTrips:destination').toUpperCase(), width: 180 },
        { field: 'm3', headerName: t('completedTrips:m3Vol').toUpperCase(), width: 90, align: 'right', valueFormatter: (v) => Number(v).toFixed(2) }
    ];

    if (loading) return <TableSkeletonLoader rows={10} />;

    return (
        <Box sx={{ height: '100%', width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                onRowClick={(params: GridRowParams) => onRowClick && onRowClick(Number(params.row.kuormaId), params.row)}
                slots={{ toolbar: GridToolbar, noRowsOverlay: () => <CustomNoRowsOverlay message={t('completedTrips:noTimber')} /> }}
                density="compact"
                sx={{
                    border: 0,
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' },
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: isDarkMode ? alpha('#fff', 0.03) : '#f8f9fa' }
                }}
            />
        </Box>
    );
};

export default TimberHistoryTab;