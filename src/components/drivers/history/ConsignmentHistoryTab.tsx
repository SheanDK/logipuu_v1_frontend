'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRowParams } from '@mui/x-data-grid';
import { useTranslation } from '@/i18n/useTranslation';
import { fetchMyCompletedLoads } from '@/services/loadService';
import { Box, Chip, useTheme, alpha } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import TableSkeletonLoader from '@/components/common/TableSkeletonLoader';
import CustomNoRowsOverlay from '@/components/common/CustomNoRowsOverlay';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface ConsignmentHistoryTabProps {
    filters: {
        searchQuery: string;
        customer: string | null;
        startDate: string;
        endDate: string;
    };
    onRowClick?: (id: number, data?: any) => void;
}

const ConsignmentHistoryTab: React.FC<ConsignmentHistoryTabProps> = ({ filters, onRowClick }) => {
    const { t } = useTranslation(['completedTrips', 'common']);
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchMyCompletedLoads();
            const consignment = data.filter((trip: any) => trip.tyyppi === 'Consignment' || Number(trip.tyyppi) === 1);
            const mapped = consignment.map((r: any) => ({ ...r, id: r.kuormaId }));

            const filtered = mapped.filter((item: any) => {
                const itemDate = dayjs(item.pvm);
                const isWithinDate = itemDate.isSameOrAfter(filters.startDate, 'day') &&
                    itemDate.isSameOrBefore(filters.endDate, 'day');
                const matchesSearch = !filters.searchQuery ||
                    item.asiakkaanNimi.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                    (item.rekNro && item.rekNro.toLowerCase().includes(filters.searchQuery.toLowerCase()));
                const matchesCustomer = !filters.customer || item.asiakkaanNimi === filters.customer;

                return isWithinDate && matchesSearch && matchesCustomer;
            });

            setRows(filtered);
        } catch (err) {
            console.error("Failed to load consignment data:", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { loadData(); }, [loadData]);

    const columns: GridColDef[] = [
        {
            field: 'pvm',
            headerName: t('completedTrips:date').toUpperCase(),
            width: 110,
            renderCell: (p) => dayjs(p.value).format(t('completedTrips:dateFormat'))
        },
        { field: 'asiakkaanNimi', headerName: t('completedTrips:customer').toUpperCase(), width: 250 },
        { field: 'm3', headerName: t('completedTrips:m3').toUpperCase(), width: 100, align: 'right' },
        {
            field: 'waybillCount',
            headerName: t('completedTrips:waybills').toUpperCase(),
            width: 120,
            align: 'center',
            renderCell: (p) => (
                <Chip
                    icon={<DescriptionIcon sx={{ fontSize: '14px !important' }} />}
                    label={p.value || '0'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                />
            )
        },
        {
            field: 'status',
            headerName: t('completedTrips:status').toUpperCase(),
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => (
                <Chip
                    label={t('completedTrips:done').toUpperCase()}
                    size="small"
                    sx={{ bgcolor: '#2e7d32', color: '#ffffff', fontWeight: '900', fontSize: '10px' }}
                />
            )
        }
    ];

    if (loading) return <TableSkeletonLoader rows={10} />;

    return (
        <Box sx={{ height: '100%', width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                onRowClick={(params: GridRowParams) => onRowClick && onRowClick(Number(params.row.kuormaId), params.row)}
                slots={{ toolbar: GridToolbar, noRowsOverlay: () => <CustomNoRowsOverlay message={t('completedTrips:noConsignments')} /> }}
                density="compact"
                hideFooterSelectedRowCount
                sx={{
                    border: 0,
                    '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
                    '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: '900',
                        fontSize: '11px',
                        color: 'text.secondary',
                        textTransform: 'uppercase'
                    },
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: isDarkMode ? alpha('#fff', 0.03) : '#f8f9fa',
                        borderBottom: '2px solid',
                        borderColor: 'divider'
                    }
                }}
            />
        </Box>
    );
};

export default ConsignmentHistoryTab;