// frontend/src/components/loads/ChipTransportTable.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import { Chip, IconButton, Box, Stack, Tooltip, Typography, alpha, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

// Icons
import ScaleIcon from '@mui/icons-material/Scale';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import PinIcon from '@mui/icons-material/Pin';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Services
import chipPlanningService from '@/services/chipPlanningService';
import EditLoadModel from '@/components/chip-order/EditLoadModel';
import { useTranslation } from '@/i18n/useTranslation';
import useSocket from '@/hooks/useSocket';
import ChipTransportDetailsModal from './ChipTransportDetailsModal';

interface ChipTransportTableProps {
    filters: any;
    refreshTrigger?: number;
    selectionModel: Set<GridRowId>;
    toggleSelectionAction: (id: GridRowId) => void;
    onErrorAction: (msg: string) => void;
    onSuccessAction: (msg: string) => void;
    onRowsUpdateAction: (rows: any[]) => void;
}

const ChipTransportTable = ({
    filters,
    refreshTrigger,
    selectionModel,
    toggleSelectionAction,
    onErrorAction,
    onSuccessAction,
    onRowsUpdateAction
}: ChipTransportTableProps) => {
    const { t } = useTranslation(['chip-management', 'loadsPage', 'common']);
    const { socket } = useSocket();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState({ open: false, data: null });
    const [detailsModal, setDetailsModal] = useState({ open: false, data: null });

    const getChipStatusColor = (status: string) => {
        switch (status) {
            case 'NOT_SENT': return { label: 'Planned', color: '#e53935' };
            case 'DISPATCHED': return { label: 'Sent', color: '#fbc02d' };
            case 'LOADED': return { label: 'Loaded', color: '#1976d2' };
            case 'UNLOADED': return { label: 'Unloaded', color: '#00bcd4' };
            case 'COMPLETED': case 'SENT': return { label: 'Done', color: '#43a047' };
            default: return { label: status, color: '#9e9e9e' };
        }
    };

    const renderRequestedInfo = (row: any) => {
        const icons = [];
        const iconStyle = { fontSize: 16, color: '#a38f6d' };
        if (row.reqPcs || row.req_pcs) icons.push(<Tooltip key="pcs" title={t('chip-management:details:pcs')}><PinIcon sx={iconStyle} /></Tooltip>);
        if (row.reqM3 || row.req_m3) icons.push(<Tooltip key="m3" title={t('chip-management:details:m3')}><ViewInArIcon sx={iconStyle} /></Tooltip>);
        if (row.reqTon || row.req_ton) icons.push(<Tooltip key="ton" title={t('chip-management:details:tons')}><ScaleIcon sx={iconStyle} /></Tooltip>);
        if (row.reqHr || row.req_hr) icons.push(<Tooltip key="hr" title={t('chip-management:details:hours')}><AccessTimeIcon sx={iconStyle} /></Tooltip>);
        if (row.reqWaiting || row.req_waiting) icons.push(<Tooltip key="wait" title={t('chip-management:details:waiting')}><HourglassEmptyIcon sx={iconStyle} /></Tooltip>);
        if (row.reqDetails || row.req_details) icons.push(<Tooltip key="info" title={t('chip-management:details:info')}><InfoOutlinedIcon sx={iconStyle} /></Tooltip>);
        return <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ height: '100%' }}>{icons.length > 0 ? icons : '-'}</Stack>;
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await chipPlanningService.searchLoads({
                status: filters.status,
                asiakasId: filters.asiakasId,
                kalustoNro: filters.kalustoNro
            });

            const mappedData = data.map((l: any) => ({
                ...l,
                id: l.load_id || l.loadId,
                rekNro: l.vehicleRegNo || l.rekNro,
                pvm: l.scheduled_date || l.scheduledDate,
                // Metric mapping (DataGrid fields vs DB columns)
                actualM3: l.actual_m3 ?? l.actualM3,
                actualTon: l.actual_ton ?? l.actualTon,
                actualPcs: l.actual_pcs ?? l.actualPcs,
                actualHr: l.actual_hr ?? l.actualHr,
                actualKm: l.actual_km ?? l.actualKm,
                actualWaiting: l.actual_waiting ?? l.actualWaiting,
                actualDetails: l.actual_details || l.actualDetails || l.load_notes || l.loadNotes
            }));

            setRows(mappedData);
            onRowsUpdateAction(mappedData);
        } catch (err) {
            onErrorAction(t('common:errors.fetchFailed'));
        } finally {
            setLoading(false);
        }
    }, [filters.status, filters.asiakasId, filters.kalustoNro, onRowsUpdateAction, onErrorAction, t, refreshTrigger]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        if (!socket) return;
        socket.on('chipLoadUpdated', () => loadData());
        return () => { socket.off('chipLoadUpdated'); };
    }, [socket, loadData]);

    const columns: GridColDef[] = useMemo(() => [
        {
            field: 'select',
            headerName: t('loadsPage:columns.select'),
            width: 60,
            sortable: false,
            renderCell: (params) => (
                <IconButton size="small" color={selectionModel.has(params.id) ? "error" : "primary"} onClick={() => toggleSelectionAction(params.id)}>
                    {selectionModel.has(params.id) ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
                </IconButton>
            ),
        },
        {
            field: 'pvm',
            headerName: t('loadsPage:columns.date'),
            width: 110,
            valueFormatter: (value) => value ? dayjs(value).format('DD.MM.YYYY') : ''
        },
        { field: 'rekNro', headerName: t('loadsPage:columns.vehicleNo'), width: 100 },
        { field: 'titleName', headerName: t('chip-management:table.titleName'), width: 150 },
        {
            field: 'requested',
            headerName: 'REQ',
            width: 120,
            align: 'center',

            renderCell: (params) => renderRequestedInfo(params.row)
        },
        { field: 'actualM3', headerName: 'm³', width: 80, align: 'right', type: 'number' },
        { field: 'actualTon', headerName: 'TON', width: 80, align: 'right', type: 'number' },
        { field: 'actualPcs', headerName: 'PCS', width: 70, align: 'center', type: 'number' },
        { field: 'actualHr', headerName: 'HR', width: 70, align: 'center', type: 'number' },
        { field: 'actualKm', headerName: 'KM', width: 70, align: 'center', type: 'number' },
        { field: 'actualWaiting', headerName: 'WAIT', width: 70, align: 'center', type: 'number' },
        {
            field: 'actualDetails',
            headerName: 'INFO',
            width: 130,
            renderCell: (p) => <Typography variant="caption" noWrap>{p.value || '-'}</Typography>
        },
        {
            field: 'status', headerName: t('loadsPage:columns.status'), width: 110,
            renderCell: (p) => {
                const info = getChipStatusColor(p.value);
                return <Chip size="small" label={info.label} sx={{ bgcolor: alpha(info.color, 0.1), color: info.color, fontWeight: 'bold', border: `1px solid ${info.color}`, fontSize: '10px' }} />;
            }
        },
        {
            field: 'actions', headerName: t('chip-management:columns.actions'), width: 70,
            renderCell: (p) => (
                <IconButton onClick={() => setEditModal({ open: true, data: p.row })} size="small"><EditIcon fontSize="small" /></IconButton>
            )
        }
    ], [selectionModel, toggleSelectionAction, t]);

    return (
        <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                onRowClick={(params, event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest('button')) return;

                    setDetailsModal({ open: true, data: params.row });
                }}
                density="compact"
                hideFooterSelectedRowCount
                sx={{
                    border: 'none',
                    cursor: 'pointer',
                    '& .MuiDataGrid-row:hover': { bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#f5f5f5' },
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: isDarkMode ? alpha('#fff', 0.05) : '#f8f9fa' },
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }
                }}
            />
            <ChipTransportDetailsModal
                open={detailsModal.open}
                loadData={detailsModal.data}
                onClose={() => setDetailsModal({ open: false, data: null })}
            />
            {editModal.open && (
                <EditLoadModel
                    open={editModal.open}
                    loadData={editModal.data}
                    onClose={() => setEditModal({ open: false, data: null })}
                    onSave={async (id: number, notes: string, allData: any) => {
                        try {
                            await chipPlanningService.updateLoadMetrics(id, {
                                ...allData,
                                actual_details: notes // Ensure this is explicitly set
                            });

                            setEditModal({ open: false, data: null });
                            loadData();
                            onSuccessAction(t('common:notifications.updateSuccess'));
                        } catch (error) {
                            onErrorAction("Update failed!");
                        }
                    }}
                />
            )}
        </Box>
    );
};

export default ChipTransportTable;