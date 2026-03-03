// frontend/src/components/loads/ConsignmentTable.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import EditConsignmentModal from './EditConsignmentModal';
import ViewConsignmentModal from './ViewConsignmentModal';
import { ILoadListItem, ITripDetails } from '@/types';
import { fetchAllLoads, fetchLoadsForInspection, getTripById, ILoadListApiFilters } from '@/services/loadService';
import { useAuth } from '@/contexts/AuthContext';
import useSocket from '@/hooks/useSocket';

const STATUS_COLOR: Record<string, ChipProps['color']> = {
    assigned: 'warning',
    in_progress: 'info',
    at_origin: 'warning',
    en_route_to_destination: 'info',
    at_destination: 'warning',
    completed: 'success',
    paused: 'error',
    draft: 'default',
};

const STATUS_TKEY: Record<string, string> = {
    'Assigned': 'assigned',
    'In Progress': 'in_progress',
    'At Origin': 'at_origin',
    'En Route to Destination': 'en_route_to_destination',
    'At Destination': 'at_destination',
    'Completed': 'completed',
    'Paused': 'paused',
    'Draft': 'draft',
};

interface ConsignmentTableProps {
    filters: any;
    selectionModel: Set<GridRowId>;
    toggleSelectionAction: (id: GridRowId) => void;
    onDeleteAction: (row: ILoadListItem) => void;
    onErrorAction: (msg: string) => void;
    onSuccessAction: (msg: string) => void;
    onRowsUpdateAction: (rows: ILoadListItem[]) => void;
}

export default function ConsignmentTable({
    filters,
    selectionModel,
    toggleSelectionAction,
    onDeleteAction,
    onErrorAction,
    onSuccessAction,
    onRowsUpdateAction
}: ConsignmentTableProps) {
    const { t } = useTranslation('loadsPage');
    const { user } = useAuth();
    const { socket } = useSocket();

    const [rows, setRows] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedLoadForEditing, setSelectedLoadForEditing] = useState<ITripDetails | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedLoadIdForView, setSelectedLoadIdForView] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            let data;
            if (filters.status === 'pending_inspection') {
                data = await fetchLoadsForInspection();
                data = data.filter((d: any) => d.tyyppi === 1);
            } else {
                const filtersForApi: ILoadListApiFilters = {
                    asiakasId: filters.asiakasId || undefined,
                    kalustoNro: filters.kalustoNro || undefined,
                    kuljId: filters.kuljId || undefined,
                    loadType: 1,
                };
                if (filters.status === 'active' || filters.status === 'all') {
                    filtersForApi.status = filters.status;
                }
                data = await fetchAllLoads(filtersForApi);
            }
            setRows(data);
            onRowsUpdateAction(data);
        } catch (err: any) {
            console.error(err);
            onErrorAction(t('errors.fetchLoads'));
        } finally {
            setIsLoading(false);
        }
    }, [filters, t, onErrorAction, onRowsUpdateAction]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!socket) return;
        const handleStatusUpdate = (updatedLoad: any) => {
            setRows((prevRows) => {
                const index = prevRows.findIndex(r => r.kuormaId === updatedLoad.kuormaId);
                if (index > -1) {
                    let newRows = [...prevRows];
                    newRows[index] = { ...newRows[index], ...updatedLoad };
                    if (filters.status === 'active' && updatedLoad.status === 'Completed') {
                        newRows = newRows.filter(r => r.kuormaId !== updatedLoad.kuormaId);
                    } else if (updatedLoad.tyyppi !== 1) {
                        newRows = newRows.filter(r => r.kuormaId !== updatedLoad.kuormaId);
                    }
                    onRowsUpdateAction(newRows);
                    return newRows;
                }
                return prevRows;
            });
        };
        socket.on('loadStatusUpdated', handleStatusUpdate);
        return () => { socket.off('loadStatusUpdated', handleStatusUpdate); };
    }, [socket, filters.status, onRowsUpdateAction]);

    const handleOpenEditModal = async (loadItem: ILoadListItem) => {
        try {
            const fullLoadData = await getTripById(loadItem.kuormaId);
            setSelectedLoadForEditing(fullLoadData);
            setIsEditModalOpen(true);
        } catch (err) {
            onErrorAction(t('errors.fetchLoadDetails'));
        }
    };

    const translateStatus = (t: any, status?: string | null) => {
        if (!status) return t('status.na', { defaultValue: '—' });
        const key = STATUS_TKEY[status];
        return key ? t(`status.${key}`, { defaultValue: status }) : status;
    };

    const getStatusChipColorByStatus = (status?: string | null): ChipProps['color'] => {
        const key = status ? STATUS_TKEY[status] : undefined;
        return key ? (STATUS_COLOR[key] ?? 'default') : 'default';
    };

    const columns: GridColDef[] = useMemo(() => [
        {
            field: 'select',
            headerName: t('columns.select'),
            width: 60,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams<any, ILoadListItem>) => {
                const isSelected = selectionModel.has(params.id);
                return (
                    <Tooltip title={isSelected ? t('tooltips.removeFromSelection') : t('tooltips.addToSelection')}>
                        <IconButton size="small" color={isSelected ? "error" : "primary"} onClick={() => toggleSelectionAction(params.id)}>
                            {isSelected ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
                        </IconButton>
                    </Tooltip>
                );
            },
        },
        {
            field: 'pvm',
            headerName: t('columns.date'),
            width: 110,
            valueFormatter: (value: any) => value ? dayjs(value).format('DD.MM.YYYY') : ''
        },
        { field: 'rekNro', headerName: t('columns.vehicleNo'), width: 110 },
        { field: 'kuljettajanNimi', headerName: t('columns.driver'), width: 120 },
        {
            field: 'totalM3',
            headerName: 'Total m3',
            width: 120,
            align: 'right',
            headerAlign: 'right',
            valueGetter: (value: any, row: any) => row.m3 || 0,
            valueFormatter: (value: any) => Number(value).toFixed(2)
        },
        {
            field: 'waybillCount',
            headerName: 'Waybills',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Chip
                    icon={<DescriptionIcon style={{ fontSize: '1rem' }} />}
                    label={params.row.waybillCount || '0'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            field: 'status', headerName: t('columns.status'), width: 120,
            renderCell: (params) => <Chip label={translateStatus(t, params.row.status)} color={getStatusChipColorByStatus(params.row.status)} size="small" />
        },
        {
            field: 'actions', headerName: t('columns.action'), width: 100, sortable: false, filterable: false,
            renderCell: (params) => (
                <Box>
                    <Tooltip title={t('tooltips.editLoad')}>
                        <IconButton onClick={(e) => { e.stopPropagation(); handleOpenEditModal(params.row); }} size="small"><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('tooltips.deleteLoad')}>
                        <IconButton onClick={(e) => { e.stopPropagation(); onDeleteAction(params.row); }} size="small" color="error"><DeleteIcon /></IconButton>
                    </Tooltip>
                </Box>
            ),
        }
    ], [selectionModel, t, onDeleteAction]);

    return (
        <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(r) => r.kuormaId}
                loading={isLoading}
                onRowClick={(params, e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('input') || target.closest('a')) return;
                    setSelectedLoadIdForView(params.row.kuormaId);
                    setViewModalOpen(true);
                }}
                hideFooterSelectedRowCount
                sx={{
                    border: 'none',
                    cursor: 'pointer',
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' },
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' },
                    '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' }
                }}
            />
            {isEditModalOpen && selectedLoadForEditing && user && (
                <EditConsignmentModal
                    open={isEditModalOpen}
                    onCloseAction={() => { setIsEditModalOpen(false); setSelectedLoadForEditing(null); }}
                    onSaveSuccessAction={(msg: string) => { setIsEditModalOpen(false); setSelectedLoadForEditing(null); loadData(); onSuccessAction(msg); }}
                    loadData={selectedLoadForEditing}
                    currentUser={user}
                />
            )}
            <ViewConsignmentModal
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                loadId={selectedLoadIdForView}
            />
        </Box>
    );
}
