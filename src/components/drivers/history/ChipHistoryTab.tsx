// frontend/src/components/drivers/history/ChipHistoryTab.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRowParams } from '@mui/x-data-grid';
import { useTranslation } from '@/i18n/useTranslation';
import chipPlanningService from '@/services/chipPlanningService';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import dayjs from 'dayjs';
import { Chip, Box, useTheme, alpha, Stack, Tooltip } from '@mui/material';

// --- Icons for REQ Column ---
import ScaleIcon from '@mui/icons-material/Scale';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import PinIcon from '@mui/icons-material/Pin';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RouteIcon from '@mui/icons-material/Route';

import TableSkeletonLoader from '@/components/common/TableSkeletonLoader';
import CustomNoRowsOverlay from '@/components/common/CustomNoRowsOverlay';

interface ChipHistoryTabProps {
    filters: { searchQuery: string; customer: string | null; startDate: string; endDate: string; };
    onRowClick?: (id: number, data?: any) => void;
}

const ChipHistoryTab: React.FC<ChipHistoryTabProps> = ({ filters, onRowClick }) => {
    const { t } = useTranslation(['completedTrips', 'chipDriver']);
    const { selectedVehicleId } = useDriverSession();
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';


    const renderRequestedInfo = (row: any) => {
        const icons = [];
        const iconStyle = { fontSize: 16, color: '#a38f6d' };


        if (row.req_pcs || row.reqPcs) icons.push(<Tooltip key="pcs" title={t('completedTrips:pieces')}><PinIcon sx={iconStyle} /></Tooltip>);
        if (row.req_m3 || row.reqM3) icons.push(<Tooltip key="m3" title={t('completedTrips:cubes')}><ViewInArIcon sx={iconStyle} /></Tooltip>);
        if (row.req_ton || row.reqTon) icons.push(<Tooltip key="ton" title={t('completedTrips:tons')}><ScaleIcon sx={iconStyle} /></Tooltip>);
        if (row.req_hr || row.reqHr) icons.push(<Tooltip key="hr" title={t('completedTrips:hours')}><AccessTimeIcon sx={iconStyle} /></Tooltip>);
        if (row.req_waiting || row.reqWaiting) icons.push(<Tooltip key="wait" title={t('completedTrips:waiting')}><HourglassEmptyIcon sx={iconStyle} /></Tooltip>);
        if (row.req_km || row.reqKm) icons.push(<Tooltip key="km" title={t('completedTrips:mileage')}><RouteIcon sx={iconStyle} /></Tooltip>);
        if (row.req_details || row.reqDetails) icons.push(<Tooltip key="info" title={t('completedTrips:furtherInfo')}><InfoOutlinedIcon sx={iconStyle} /></Tooltip>);

        return (
            <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
                {icons.length > 0 ? icons : '-'}
            </Stack>
        );
    };

    const loadData = useCallback(async () => {
        if (!selectedVehicleId) return;
        setLoading(true);
        try {
            const data = await chipPlanningService.searchLoads({
                status: 'completed',
                kalustoNro: Number(selectedVehicleId),
                startDate: filters.startDate,
                endDate: filters.endDate
            });

            const mappedData = data.map((r: any) => ({
                ...r,
                id: r.load_id || r.loadId,
                displayDate: r.scheduled_date || r.scheduledDate,
                customer: r.titleName || r.title_name || '-',
                reqPcs: r.req_pcs ?? r.reqPcs,
                reqM3: r.req_m3 ?? r.reqM3,
                reqTon: r.req_ton ?? r.reqTon,
                reqHr: r.req_hr ?? r.reqHr,
                reqKm: r.req_km ?? r.reqKm,
                reqWaiting: r.req_waiting ?? r.reqWaiting,
                reqDetails: r.req_details ?? r.reqDetails,

                actualM3: Number(r.actual_m3 ?? r.actualM3 ?? 0),
                actualTon: Number(r.actual_ton ?? r.actualTon ?? 0),
                actualPcs: Number(r.actual_pcs ?? r.actualPcs ?? 0),
                actualHr: Number(r.actual_hr ?? r.actualHr ?? 0),
                actualKm: Number(r.actual_km ?? r.actualKm ?? 0),
                actualWaiting: Number(r.actual_waiting ?? r.actualWaiting ?? 0),
            }));

            const filtered = mappedData.filter((item: { customer: string; vehicle: string }) => {
                const matchesSearch = !filters.searchQuery ||
                    item.customer.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                    item.vehicle.toLowerCase().includes(filters.searchQuery.toLowerCase());

                const matchesCustomer = !filters.customer || item.customer === filters.customer;

                return matchesSearch && matchesCustomer;
            });

            setRows(filtered);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [selectedVehicleId, filters]);

    useEffect(() => { loadData(); }, [loadData]);

    const columns: GridColDef[] = [
        {
            field: 'displayDate',
            headerName: t('completedTrips:date').toUpperCase(),
            width: 105,
            renderCell: (params) => dayjs(params.value).format(t('completedTrips:dateFormat'))
        },
        { field: 'customer', headerName: t('completedTrips:customer').toUpperCase(), width: 200 },
        {
            field: 'req',
            headerName: t('completedTrips:req').toUpperCase(),
            width: 130,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => renderRequestedInfo(params.row)
        },
        { field: 'actualM3', headerName: t('completedTrips:cubes').toUpperCase(), width: 80, align: 'right', headerAlign: 'right', valueFormatter: (v) => Number(v).toFixed(2) },
        { field: 'actualTon', headerName: t('completedTrips:tons').toUpperCase(), width: 80, align: 'right', headerAlign: 'right', valueFormatter: (v) => Number(v).toFixed(2) },
        { field: 'actualPcs', headerName: t('completedTrips:pieces').toUpperCase(), width: 70, align: 'center', headerAlign: 'center' },
        { field: 'actualHr', headerName: t('completedTrips:hours').toUpperCase(), width: 70, align: 'center', headerAlign: 'center' },
        { field: 'actualKm', headerName: t('completedTrips:mileage').toUpperCase(), width: 70, align: 'center', headerAlign: 'center' },
        { field: 'actualWaiting', headerName: t('completedTrips:waiting').toUpperCase(), width: 70, align: 'center', headerAlign: 'center' },
        {
            field: 'status',
            headerName: t('completedTrips:status').toUpperCase(),
            width: 90,
            renderCell: (params) => (
                <Chip
                    label={t('completedTrips:done').toUpperCase()} size="small"
                    sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, fontWeight: '900', fontSize: '10px', border: `1px solid ${theme.palette.success.main}` }}
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
                onRowClick={(params: GridRowParams) => onRowClick && onRowClick(params.row.id, params.row)}
                slots={{ toolbar: GridToolbar, noRowsOverlay: () => <CustomNoRowsOverlay message={t('completedTrips:noCompletedChipLoadsFound')} /> }}
                density="compact"
                hideFooterSelectedRowCount
                sx={{
                    border: 0,
                    '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: '900', fontSize: '11px', color: 'text.secondary' },
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: isDarkMode ? alpha('#fff', 0.03) : '#f8f9fa', borderBottom: '2px solid', borderColor: 'divider' }
                }}
            />
        </Box>
    );
};

export default ChipHistoryTab;