// frontend/src/components/loads/TimberLoadTable.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Chip, IconButton, Tooltip, useTheme, alpha } from '@mui/material';

import type { ChipProps } from '@mui/material/Chip';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId, GridRowModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import EditLoadModal from './EditLoadModal';
import { ILoadListItem, ITripDetails, IUpdateLoadDto } from '@/types';
import { fetchAllLoads, fetchLoadsForInspection, getTripById, updateLoad, ILoadListApiFilters } from '@/services/loadService';
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

interface TimberLoadTableProps {
    filters: any;
    refreshTrigger?: number;
    selectionModel: Set<GridRowId>;
    toggleSelectionAction: (id: GridRowId) => void;
    onDeleteAction: (row: ILoadListItem) => void;
    onErrorAction: (msg: string) => void;
    onSuccessAction: (msg: string) => void;
    onRowsUpdateAction: (rows: ILoadListItem[]) => void;
}

export default function TimberLoadTable({
    filters,
    refreshTrigger,
    selectionModel,
    toggleSelectionAction,
    onDeleteAction,
    onErrorAction,
    onSuccessAction,
    onRowsUpdateAction
}: TimberLoadTableProps) {
    const { t } = useTranslation('loadsPage');
    const { user } = useAuth();
    const { socket } = useSocket();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';


    const [rows, setRows] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedLoadForEditing, setSelectedLoadForEditing] = useState<ITripDetails | null>(null);

    const isInspectionView = useMemo(() => filters.status === 'pending_inspection', [filters.status]);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            let data;
            if (filters.status === 'pending_inspection') {
                data = await fetchLoadsForInspection();
                data = data.filter((d: any) => d.tyyppi === 0);
            } else {
                const filtersForApi: ILoadListApiFilters = {
                    asiakasId: filters.asiakasId || undefined,
                    kalustoNro: filters.kalustoNro || undefined,
                    kuljId: filters.kuljId || undefined,
                    loadType: 0,
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
    }, [filters, t, onErrorAction, onRowsUpdateAction, refreshTrigger]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!socket) return;
        const handleStatusUpdate = (updatedLoad: any) => {
            setRows((prevRows) => {
                const index = prevRows.findIndex(r => r.kuormaId === updatedLoad.kuormaId);
                if (index > -1) {
                    const newRows = [...prevRows];
                    newRows[index] = { ...newRows[index], ...updatedLoad };
                    if (filters.status === 'active' && updatedLoad.status === 'Completed') {
                        return newRows.filter(r => r.kuormaId !== updatedLoad.kuormaId);
                    }
                    if (updatedLoad.tyyppi !== 0) {
                        const filteredRows = newRows.filter(r => r.kuormaId !== updatedLoad.kuormaId);
                        onRowsUpdateAction(filteredRows);
                        return filteredRows;
                    }
                    onRowsUpdateAction(newRows);
                    return newRows;
                }
                return prevRows;
            });
        };
        socket.on('loadStatusUpdated', handleStatusUpdate);
        return () => { socket.off('loadStatusUpdated', handleStatusUpdate); };
    }, [socket, filters.status]);

    const handleOpenEditModal = async (loadItem: ILoadListItem) => {
        try {
            const fullLoadData = await getTripById(loadItem.kuormaId);
            setSelectedLoadForEditing(fullLoadData);
            setIsEditModalOpen(true);
        } catch (err) {
            onErrorAction(t('errors.fetchLoadDetails'));
        }
    };

    const handleProcessRowUpdate = useCallback(async (newRow: GridRowModel<ILoadListItem>): Promise<ILoadListItem> => {
        if (!user) {
            onErrorAction('User not authenticated');
            return rows.find(r => r.kuormaId === newRow.kuormaId)!;
        }
        const payload: IUpdateLoadDto = {
            pvm: dayjs(newRow.pvm, "DD.MM.YYYY").toDate(),
            vastaanottoNro: newRow.vastaanottoNro, reitti: newRow.reitti,
            m3: newRow.m3, km: newRow.km, tunnit: newRow.tunnit,
            kpl: newRow.kpl, lisatiedot: newRow.lisatiedot
        };
        try {
            await updateLoad(newRow.kuormaId, payload, user);
            onSuccessAction(t('snackbar.updated', { id: newRow.kuormaId }));
            return newRow;
        } catch (err: any) {
            onErrorAction(t('snackbar.updateFailed'));
            return rows.find(r => r.kuormaId === newRow.kuormaId)!;
        }
    }, [rows, user, t, onErrorAction, onSuccessAction]);

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
        { field: 'ajomaaraysNro', headerName: t('columns.drivingOrder'), width: 130 },
        { field: 'vastaanottoNro', headerName: t('columns.receptionNo'), width: 130 },
        { field: 'puulaaniNimi', headerName: t('columns.puulaani'), width: 100 },
        { field: 'asiakkaanNimi', headerName: t('columns.customer'), width: 140 },
        { field: 'timberType', headerName: t('columns.timber'), width: 120 },
        { field: 'reitti', headerName: t('columns.route'), width: 100 },
        { field: 'm3', headerName: t('columns.cubicMetres'), type: 'number', width: 120 },
        { field: 'km', headerName: t('columns.freightKm'), type: 'number', width: 120 },
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
                processRowUpdate={isInspectionView ? handleProcessRowUpdate : undefined}
                isCellEditable={(params) => !!(isInspectionView && params.colDef.editable)}
                onProcessRowUpdateError={(e) => console.error(e)}
                editMode="row"
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 25, page: 0 },
                    },
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                hideFooterSelectedRowCount
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: isDarkMode ? alpha('#fff', 0.05) : '#f8f9fa',
                        borderBottom: '2px solid',
                        borderColor: 'divider',
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        fontSize: '11px',
                        color: 'text.secondary',
                        letterSpacing: '0.05rem',
                    },
                    '& .MuiDataGrid-footerContainer': {
                        backgroundColor: isDarkMode ? alpha('#fff', 0.02) : '#f8f9fa',
                        borderTop: 'none',
                    },
                }}

            />
            {isEditModalOpen && selectedLoadForEditing && user && (
                <EditLoadModal
                    open={isEditModalOpen}
                    onCloseAction={() => { setIsEditModalOpen(false); setSelectedLoadForEditing(null); }}
                    onSaveSuccessAction={(msg) => { setIsEditModalOpen(false); setSelectedLoadForEditing(null); loadData(); onSuccessAction(msg); }}
                    loadData={selectedLoadForEditing}
                    currentUser={user}
                />
            )}
        </Box>
    );
}
