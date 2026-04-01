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
import DeleteIcon from '@mui/icons-material/Delete';

// Services & Contexts
import chipPlanningService from '@/services/chipPlanningService';
import EditLoadModel from '@/components/chip-order/EditLoadModel';
import { useTranslation } from '@/i18n/useTranslation';
import useSocket from '@/hooks/useSocket';
import ChipTransportDetailsModal from './ChipTransportDetailsModal';
import { useAuth } from '@/contexts/AuthContext';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { boolean } from 'yup';

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
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // --- 🚀 FIX: Declare missing hooks and variables ---
    const { user } = useAuth();
    const { selectedVehicleId } = useDriverSession();
    const isDriver = user?.roles.includes('Kuljettaja');
    const { socket } = useSocket(isDriver ? user?.driverNumericId : 0);

    const [rows, setRows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Ensure name is setIsLoading
    const [editModal, setEditModal] = useState({ open: false, data: null });
    const [detailsModal, setDetailsModal] = useState({ open: false, data: null });
    const [softDeleteConfirm, setSoftDeleteConfirm] = useState<{ open: boolean, loadId: number | null }>({
        open: false,
        loadId: null
    });

    const handleConfirmSoftDelete = async () => {
        if (!softDeleteConfirm.loadId) return;

        try {
            await chipPlanningService.softDeleteLoad(softDeleteConfirm.loadId);
            onSuccessAction(t('common:notifications.archiveSuccess', { defaultValue: "Load archived successfully" }));
            setSoftDeleteConfirm({ open: false, loadId: null });
            loadData();
        } catch (error) {
            onErrorAction("Archive failed!");
        }
    };

    const getChipStatusColor = (status: string) => {
        switch (status) {
            case 'NOT_SENT':
                return { label: 'Planned', color: '#9e9e9e', textColor: '#ffffff' };
            case 'DISPATCHED':
                return { label: 'Sent', color: '#fbc02d', textColor: '#000000' };
            case 'LOADED':
                return { label: 'Loaded', color: '#ed6c02', textColor: '#ffffff' };
            case 'UNLOADED':
                return { label: 'Unloaded', color: '#0288d1', textColor: '#ffffff' };
            case 'COMPLETED':
            case 'SENT':
                return { label: 'Done', color: '#2e7d32', textColor: '#ffffff' };
            default:
                return { label: status, color: '#9e9e9e', textColor: '#ffffff' };
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
        setIsLoading(true); // Fixed: Use correct setter name
        try {
            // Resolve correct vehicle number for filtering
            const effectiveKalustoNro = isDriver ? Number(selectedVehicleId) : filters.kalustoNro;

            const data = await chipPlanningService.searchLoads({
                status: filters.status,
                asiakasId: filters.asiakasId,
                kalustoNro: effectiveKalustoNro
            });

            const mappedData = data.map((l: any) => ({
                ...l,
                id: l.load_id || l.loadId,
                rekNro: l.vehicleRegNo || l.rekNro,
                pvm: l.scheduled_date || l.scheduledDate,
                driverName: l.driverName || l.driver_name || 'N/A',
                actualM3: Number(l.actual_m3 ?? l.actualM3 ?? 0),
                actualTon: Number(l.actual_ton ?? l.actualTon ?? 0),
                actualPcs: Number(l.actual_pcs ?? l.actualPcs ?? 0),
                actualHr: Number(l.actual_hr ?? l.actualHr ?? 0),
                actualKm: Number(l.actual_km ?? l.actualKm ?? 0),
                actualWaiting: Number(l.actual_waiting ?? l.actualWaiting ?? 0),
                actualDetails: l.actual_details || l.actualDetails || l.load_notes || l.loadNotes || ''
            }));

            setRows(mappedData);
            onRowsUpdateAction(mappedData);
        } catch (err) {
            console.error("Fetch failed:", err);
            onErrorAction(t('common:errors.fetchFailed'));
        } finally {
            setIsLoading(false); // Fixed: Use correct setter name
        }
    }, [filters.status, filters.asiakasId, filters.kalustoNro, isDriver, selectedVehicleId, onRowsUpdateAction, onErrorAction, t, refreshTrigger]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        if (!socket) return;
        socket.on('chipLoadUpdated', () => loadData());
        socket.on('chipLoadDeleted', () => loadData());
        return () => {
            socket.off('chipLoadUpdated');
            socket.off('chipLoadDeleted');
        };
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
        { field: 'driverName', headerName: t('loadsPage:columns.driver'), width: 150 },
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
        { field: 'actualPcs', headerName: 'PCS', width: 70, align: 'right', type: 'number' },
        { field: 'actualHr', headerName: 'HR', width: 70, align: 'right', type: 'number' },
        { field: 'actualKm', headerName: 'KM', width: 70, align: 'right', type: 'number' },
        { field: 'actualWaiting', headerName: 'WAIT', width: 70, align: 'right', type: 'number' },
        {
            field: 'actualDetails',
            headerName: 'INFO',
            width: 130,
            renderCell: (p) => <Typography variant="caption" noWrap>{p.value || '-'}</Typography>
        },
        {
            field: 'status',
            headerName: t('loadsPage:columns.status'),
            width: 110,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => {
                const info = getChipStatusColor(p.value);
                return (
                    <Chip
                        size="small"
                        label={info.label.toUpperCase()}
                        sx={{
                            bgcolor: info.color,
                            color: info.textColor,
                            fontWeight: '900',
                            fontSize: '10px',
                            borderRadius: '12px',
                            width: '90px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            '& .MuiChip-label': { px: 1 }
                        }}
                    />
                );
            }
        },
        {
            field: 'actions',
            headerName: t('chip-management:columns.actions'),
            width: 100,
            renderCell: (p) => {
                const isDone = p.row.status === 'SENT' || p.row.status === 'COMPLETED';
                return (
                    <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => setEditModal({ open: true, data: p.row })} size="small">
                            <EditIcon fontSize="small" />
                        </IconButton>

                        {isDone && (
                            <Tooltip title="Archive Load">
                                <IconButton
                                    onClick={() => setSoftDeleteConfirm({ open: true, loadId: p.row.id })}
                                    size="small"
                                    color="error"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                );
            }
        }
    ], [selectionModel, toggleSelectionAction, t]);

    return (
        <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                loading={isLoading}
                onRowClick={(params, event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest('button')) return;
                    setDetailsModal({ open: true, data: params.row });
                }}
                density="compact"
                initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                pageSizeOptions={[10, 25, 50, 100]}
                hideFooterSelectedRowCount
                sx={{
                    border: 'none',
                    cursor: 'pointer',
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: isDarkMode ? alpha('#fff', 0.05) : '#f8f9fa' },
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' },
                    '& .MuiDataGrid-row:hover': { bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#f5f5f5' }
                }}
            />
            <ConfirmationDialog
                open={softDeleteConfirm.open}
                onClose={() => setSoftDeleteConfirm({ open: false, loadId: null })}
                onConfirm={handleConfirmSoftDelete}
                title={t('chip-management:planning.archiveDialog.title', { defaultValue: "Archive Load" })}
                message={t('chip-management:planning.archiveDialog.message', { defaultValue: "Are you sure you want to remove this completed load from inspection view? It will still be available in history." })}
                confirmButtonText={t('common:buttons.archive', { defaultValue: "Archive" })}
                confirmButtonColor="error"
            />
            <ChipTransportDetailsModal open={detailsModal.open} loadData={detailsModal.data} onClose={() => setDetailsModal({ open: false, data: null })} />
            {editModal.open && (
                <EditLoadModel
                    open={editModal.open}
                    loadData={editModal.data}
                    onClose={() => setEditModal({ open: false, data: null })}
                    onSave={async (id: number, notes: string, allData: any) => {
                        try {
                            await chipPlanningService.updateLoadMetrics(id, { ...allData, actual_details: notes });
                            setEditModal({ open: false, data: null });
                            loadData();
                            onSuccessAction(t('common:notifications.updateSuccess'));
                        } catch (error) { onErrorAction("Update failed!"); }
                    }}
                />
            )}
        </Box>
    );
};

export default ChipTransportTable;