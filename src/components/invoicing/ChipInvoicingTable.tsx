// frontend/src/components/invoicing/ChipInvoicingTable.tsx
'use client';
import React, { useMemo } from 'react';
import {
    Box, Paper, Typography, Button, Stack, IconButton,
    Chip, Checkbox, useTheme, alpha
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';

const ChipInvoicingTable = ({ rows, onEdit, onSelectionChange, selectionMap, errorTrigger }: any) => {
    const theme = useTheme();

    const blinkKeyframes = `
        @keyframes blink-red {
            0% { background-color: transparent; }
            50% { background-color: ${alpha(theme.palette.error.main, 0.3)}; }
            100% { background-color: transparent; }
        }
    `;

    // --- 1. Column Width Definitions ---
    const AMNT_COL_WIDTH = 70;
    const PRCE_COL_WIDTH = 90;
    const TOTAL_COL_WIDTH = 100;

    // --- 2. Grouping Logic ---
    const groups = useMemo(() => {
        const map = new Map();
        rows.forEach((r: any) => {
            const key = `${r.date}_${r.customer}_${r.vehicle}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(r);
        });
        return Array.from(map.entries());
    }, [rows]);

    const handleGroupToggle = (key: string, groupRows: any[]) => {
        const rowIds = groupRows.map(r => r.loadId);
        const isCurrentlySelected = !!selectionMap[key];
        onSelectionChange(key, isCurrentlySelected ? null : rowIds);
    };

    const columns: GridColDef[] = [
        {
            field: 'status', headerName: 'Status', width: 110,
            renderCell: (p: any) => {
                const isBilled = p.row.billed;
                const hasTotal = Number(p.row.total || 0) > 0;
                return (
                    <Chip
                        label={isBilled ? "Billed" : (hasTotal ? "Unbilled" : "No Price")}
                        variant="outlined" size="small"
                        color={isBilled ? "success" : (hasTotal ? "info" : "error")}
                        sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                    />
                );
            }
        },
        {
            field: 'actions', headerName: 'Actions', width: 80, sortable: false,
            renderCell: (p: any) => (
                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => onEdit(p.row)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
            )
        },
        { field: 'date', headerName: 'Date', width: 90, valueFormatter: (params: any) => dayjs(params).format('DD.MM.YYYY') },
        { field: 'loadId', headerName: 'Serial', width: 70 },
        { field: 'titleName', headerName: 'Route / Item', flex: 1, minWidth: 150 },

        // Amount Columns
        { field: 'actualM3', headerName: 'm³', width: AMNT_COL_WIDTH, type: 'number', align: 'right' },
        { field: 'actualTon', headerName: 'Ton', width: AMNT_COL_WIDTH, type: 'number', align: 'right' },
        { field: 'actualPcs', headerName: 'Pcs', width: AMNT_COL_WIDTH, type: 'number', align: 'right' },
        { field: 'actualHr', headerName: 'Hours', width: AMNT_COL_WIDTH, type: 'number', align: 'right' },

        // Price Columns
        { field: 'unitPriceM3', headerName: 'm³ price', width: PRCE_COL_WIDTH, type: 'number', align: 'right', renderCell: (p: any) => `${Number(p.value || 0).toFixed(2)} €` },
        { field: 'unitPriceTon', headerName: 'Ton price', width: PRCE_COL_WIDTH, type: 'number', align: 'right', renderCell: (p: any) => `${Number(p.value || 0).toFixed(2)} €` },
        { field: 'unitPriceHr', headerName: 'Hour price', width: PRCE_COL_WIDTH, type: 'number', align: 'right', renderCell: (p: any) => `${Number(p.value || 0).toFixed(2)} €` },
        {
            field: 'total', headerName: 'Total', width: TOTAL_COL_WIDTH, align: 'right',
            renderCell: (p: any) => <strong style={{ color: '#a38f6d' }}>{Number(p.row.total || 0).toFixed(2)} €</strong>
        }
    ];

    return (
        <Stack spacing={3}>
            <style>{blinkKeyframes}</style>
            {groups.map(([key, groupRows]: any) => {
                const firstRow = groupRows[0];
                const isSelected = !!selectionMap[key];

                return (
                    <Paper
                        key={key}
                        elevation={0}
                        sx={{
                            border: '1px solid', borderColor: 'divider', borderRadius: '4px',
                            overflow: 'hidden', bgcolor: 'background.paper'
                        }}
                    >
                        {/* --- 🚀 Professional Group Header with Metadata & Aligned Group Labels --- */}
                        <Stack
                            direction="row"
                            alignItems="center"
                            sx={{
                                p: 1.5,
                                bgcolor: alpha(theme.palette.text.primary, 0.03),
                                borderBottom: '1px solid', borderColor: 'divider'
                            }}
                        >
                            {/* Left Side: Metadata (Date, Customer, Vehicle) */}
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                                <Checkbox
                                    checked={isSelected}
                                    onChange={() => handleGroupToggle(key, groupRows)}
                                    sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' }, p: 0.5 }}
                                />
                                <Stack spacing={0.2}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {dayjs(firstRow.date).format('DD.MM.YYYY')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        Customer: <strong>{firstRow.customer}</strong> | Vehicle: <strong>{firstRow.vehicle}</strong>
                                    </Typography>
                                </Stack>

                            </Stack>

                            {/* Right Side: Group Labels (Amount & Price) aligned with columns below */}
                            <Stack direction="row" alignItems="center">

                                <Typography
                                    variant="caption" fontWeight="bold" color="text.secondary"
                                    sx={{
                                        width: AMNT_COL_WIDTH * 4,
                                        textAlign: 'center',
                                        borderBottom: '1px solid #e0e0e0',
                                        mx: 1
                                    }}
                                >
                                    AMOUNT
                                </Typography>

                                <Typography
                                    variant="caption" fontWeight="bold" color="text.secondary"
                                    sx={{
                                        width: (PRCE_COL_WIDTH * 2.67) + TOTAL_COL_WIDTH, // Prices + Total
                                        textAlign: 'center',
                                        borderBottom: '1px solid #e0e0e0',
                                        mr: 2
                                    }}
                                >
                                    PRICE
                                </Typography>
                            </Stack>
                        </Stack>

                        <Box sx={{ width: '100%' }}>
                            <DataGrid
                                rows={groupRows}
                                columns={columns}
                                getRowId={(r) => r.loadId}
                                checkboxSelection={false}
                                density="compact"
                                autoHeight
                                hideFooter
                                getRowClassName={(params) => {
                                    const hasNoPrice = Number(params.row.total || 0) === 0;
                                    const isBilled = params.row.billed;
                                    return (isSelected && hasNoPrice && errorTrigger > 0) ? 'blink-error-row' : '';
                                }}
                                sx={{
                                    border: 'none',
                                    '& .MuiDataGrid-columnHeaders': { bgcolor: 'transparent' },
                                    '& .blink-error-row': {
                                        animation: `blink-red 0.8s ease-in-out 3`,
                                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
                                    },
                                    '& .MuiDataGrid-cell': { fontSize: '0.75rem' }
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