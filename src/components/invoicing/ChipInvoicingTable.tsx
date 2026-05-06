// frontend/src/components/invoicing/ChipInvoicingTable.tsx
'use client';
import React, { useMemo } from 'react';
import { Box, Paper, Typography, Stack, IconButton, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridColumnGroupingModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';

const getChipStatus = (row: any): 'billed' | 'unbilled' | 'noPrice' | 'changed' => {
    if (row.billed || row.billedDate) return 'billed';
    if (row.changed) return 'changed';

    // Status switches dynamically based on calculated totals
    const hasPrice =
        Number(row.unitPriceM3 || 0) > 0 ||
        Number(row.unitPriceTon || 0) > 0 ||
        Number(row.unitPriceHr || 0) > 0 ||
        Number(row.unitPricePcs || 0) > 0 ||
        Number(row.total || 0) > 0;

    return hasPrice ? 'unbilled' : 'noPrice';
};

interface ChipInvoicingTableProps {
    rows: any[];
    invalidIds: number[];
    onEdit: (row: any) => void;
    onSelectionChange: (groupKey: string, selectedIds: any[]) => void;
}

const ChipInvoicingTable: React.FC<ChipInvoicingTableProps> = ({ rows, onEdit, onSelectionChange, invalidIds }) => {

    // Grouping loads by Date + Customer + Vehicle
    const groups = useMemo(() => {
        const map = new Map();
        rows.forEach((r: any) => {
            const key = `${r.date}_${r.customer}_${r.vehicle}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(r);
        });
        return Array.from(map.entries());
    }, [rows]);

    const StatusChip: React.FC<{ row: any }> = ({ row }) => {
        const status = getChipStatus(row);

        switch (status) {
            case 'billed':
                return (
                    <Chip
                        size="small"
                        variant="outlined"
                        color="success"
                        icon={<CheckCircleIcon sx={{ fontSize: '1rem !important' }} />}
                        label="Billed"
                        sx={{ fontWeight: 600, border: '1px solid #2e7d32' }}
                    />
                );
            case 'unbilled':
                return (
                    <Chip
                        size="small"
                        variant="outlined"
                        color="info"
                        icon={<HourglassEmptyIcon sx={{ fontSize: '1rem !important' }} />}
                        label="Unbilled"
                        sx={{ fontWeight: 600, border: '1px solid #0288d1' }}
                    />
                );
            case 'noPrice':
                return (
                    <Chip
                        size="small"
                        variant="outlined"
                        color="error"
                        icon={<MoneyOffIcon sx={{ fontSize: '1rem !important' }} />}
                        label="No Price"
                        sx={{ fontWeight: 600, border: '1px solid #d32f2f' }}
                    />
                );
            case 'changed':
                return (
                    <Chip
                        size="small"
                        variant="outlined"
                        color="warning"
                        icon={<EditIcon sx={{ fontSize: '1rem !important' }} />}
                        label="Changed"
                        sx={{ fontWeight: 600, border: '1px solid #ed6c02' }}
                    />
                );
            default:
                return null;
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (p) => <StatusChip row={p.row} />
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 90,
            sortable: false,
            renderCell: (p) => (
                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => onEdit(p.row)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )
        },
        { field: 'date', headerName: 'Date', width: 110, valueFormatter: (params: any) => dayjs(params).format('DD.MM.YYYY') },
        { field: 'loadId', headerName: 'Serial No', width: 90 },
        { field: 'titleName', headerName: 'Route / Item', flex: 1 },

        // Amount Columns (Right Aligned)
        { field: 'actualM3', headerName: 'm³', width: 70, type: 'number', align: 'right', headerAlign: 'right' },
        { field: 'actualTon', headerName: 'Ton', width: 70, type: 'number', align: 'right', headerAlign: 'right' },
        { field: 'actualPcs', headerName: 'Pcs', width: 70, type: 'number', align: 'right', headerAlign: 'right' },
        { field: 'actualHr', headerName: 'Hours', width: 70, type: 'number', align: 'right', headerAlign: 'right' },

        // Unit Price Columns mapped to Backend values
        {
            field: 'unitPriceM3',
            headerName: 'm³ price',
            width: 90,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => `${Number(p.value || 0).toFixed(2)} €`
        },
        {
            field: 'unitPriceTon',
            headerName: 'Ton price',
            width: 90,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => `${Number(p.value || 0).toFixed(2)} €`
        },
        {
            field: 'unitPriceHr',
            headerName: 'Hour price',
            width: 90,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => `${Number(p.value || 0).toFixed(2)} €`
        },
        {
            field: 'total',
            headerName: 'Total',
            width: 110,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => {
                const r = p.row;
                const total = (Number(r.actualM3) * Number(r.unitPriceM3 || 0)) +
                    (Number(r.actualTon) * Number(r.unitPriceTon || 0)) +
                    (Number(r.actualHr) * Number(r.unitPriceHr || 0));
                return <strong>{total.toFixed(2)} €</strong>;
            }
        }
    ];

    const columnGroupingModel: GridColumnGroupingModel = [
        {
            groupId: 'Amount',
            headerName: 'Amount',
            children: [{ field: 'actualM3' }, { field: 'actualTon' }, { field: 'actualPcs' }, { field: 'actualHr' }],
            headerAlign: 'center',
        },
        {
            groupId: 'Price',
            headerName: 'Price',
            children: [
                { field: 'unitPriceM3' },
                { field: 'unitPriceTon' },
                { field: 'unitPriceHr' },
                { field: 'total' }
            ],
            headerAlign: 'center',
        },
    ];

    return (
        <Stack spacing={4}>
            {groups.map(([groupKey, groupRows]: any) => {
                const firstRow = groupRows[0];
                const displayDate = dayjs(firstRow.date).isValid() ? dayjs(firstRow.date).format('DD.MM.YYYY') : 'N/A';

                return (
                    <Paper
                        key={groupKey}
                        elevation={0}
                        sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}
                    >
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ p: 1.5, bgcolor: '#fff', borderBottom: '1px solid #e0e0e0' }}
                        >
                            <Stack spacing={0.5}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {displayDate}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Customer: <strong>{firstRow.customer || 'N/A'}</strong> |
                                    Vehicle: <strong>{firstRow.vehicle || 'N/A'}</strong> |
                                    Driver: <strong>{firstRow.driverName || 'N/A'}</strong>
                                </Typography>
                            </Stack>
                        </Stack>

                        <Box sx={{ width: '100%' }}>
                            <DataGrid
                                rows={groupRows}
                                columns={columns}
                                getRowId={(r) => r.loadId}
                                checkboxSelection
                                autoHeight
                                density="compact"
                                columnGroupingModel={columnGroupingModel}

                                // Resolves Typescript error 2352 using double casting
                                onRowSelectionModelChange={(newSelectionModel) => {
                                    const selectedIds = newSelectionModel as unknown as (string | number)[];
                                    onSelectionChange(groupKey, selectedIds);
                                }}

                                // Highlight rows that do not have valid unit prices
                                getRowClassName={(params) =>
                                    invalidIds.includes(Number(params.row.loadId)) ? 'error-row-highlight' : ''
                                }
                                sx={{
                                    border: 'none',
                                    '& .error-row-highlight': {
                                        bgcolor: '#ffebee !important',
                                        '&:hover': { bgcolor: '#ffcdd2 !important' }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                );
            })}
        </Stack>
    );
};

export default ChipInvoicingTable;