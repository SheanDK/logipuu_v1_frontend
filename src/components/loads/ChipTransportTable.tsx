// frontend/src/components/loads/ChipTransportTable.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useTranslation } from 'react-i18next';

import chipPlanningService from '@/services/chipPlanningService';
import ModifyLoadModal from '@/components/chip-order/ModifyLoadModal';
import { useAuth } from '@/contexts/AuthContext';

dayjs.extend(isoWeek);

interface ChipTransportTableProps {
    filters: any;
    selectionModel: Set<GridRowId>;
    toggleSelectionAction: (id: GridRowId) => void;
    onErrorAction: (msg: string) => void;
    onSuccessAction: (msg: string) => void;
    onRowsUpdateAction: (rows: any[]) => void;
}

export default function ChipTransportTable({
    filters,
    selectionModel,
    toggleSelectionAction,
    onErrorAction,
    onSuccessAction,
    onRowsUpdateAction
}: ChipTransportTableProps) {
    const { t } = useTranslation('loadsPage');
    const { user } = useAuth();

    const [rows, setRows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editModal, setEditModal] = useState({ open: false, data: null });

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const week = dayjs().isoWeek();
            const year = dayjs().year();
            const planData = await chipPlanningService.getWeeklyPlanning(week, year);

            const flatData = planData.flatMap((v: any) => v.loads.map((l: any) => ({
                ...l,
                id: l.loadId,
                kuormaId: l.loadId,
                pvm: l.date,
                asiakkaanNimi: l.titleName,
                m3: l.actualM3 || 0,
                rekNro: v.rekNro,
                kalustoNro: v.kalustoNro,
            })));

            let filtered = flatData;
            if (filters.asiakasId) filtered = filtered.filter((f: any) => String(f.asiakasId) === filters.asiakasId);
            if (filters.kalustoNro) filtered = filtered.filter((f: any) => String(f.kalustoNro) === filters.kalustoNro);
            if (filters.kuljId) filtered = filtered.filter((f: any) => String(f.kuljId) === filters.kuljId);

            setRows(filtered);
            onRowsUpdateAction(filtered);
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

    const columns: GridColDef[] = useMemo(() => [
        {
            field: 'select',
            headerName: t('columns.select'),
            width: 60,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams<any, any>) => {
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
            field: 'date',
            headerName: t('columns.date'),
            width: 120,
            valueFormatter: (value: any) => value ? dayjs(value).format('DD.MM.YYYY') : ''
        },
        { field: 'rekNro', headerName: t('columns.vehicleNo'), width: 120 },
        { field: 'titleName', headerName: 'Item Name', width: 200 },
        {
            field: 'actualM3',
            headerName: 'm³',
            width: 100,
            type: 'number'
        },
        {
            field: 'actualTon',
            headerName: 'Tons',
            width: 100,
            type: 'number'
        },
        {
            field: 'status',
            headerName: t('columns.status'),
            width: 130,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    size="small"
                    label={params.value || 'Planned'}
                    color={params.value === 'Completed' ? 'success' : 'info'}
                />
            )
        },
        {
            field: 'actions',
            headerName: t('columns.action'),
            width: 80,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Tooltip title={t('tooltips.editLoad')}>
                    <IconButton onClick={() => setEditModal({ open: true, data: params.row })} size="small">
                        <EditIcon />
                    </IconButton>
                </Tooltip>
            )
        }
    ], [selectionModel, t, toggleSelectionAction]);

    return (
        <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                loading={isLoading}
                disableRowSelectionOnClick
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' },
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' },
                }}
            />
            {editModal.open && (
                <ModifyLoadModal
                    open={editModal.open}
                    loadData={editModal.data}
                    onClose={() => setEditModal({ open: false, data: null })}
                    onSave={() => {
                        setEditModal({ open: false, data: null });
                        loadData();
                        onSuccessAction(t('snackbar.updated', { id: (editModal.data as any)?.loadId }));
                    }}
                />
            )}
        </Box>
    );
}
