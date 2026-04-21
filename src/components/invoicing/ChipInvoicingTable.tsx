// frontend/src/components/invoicing/ChipInvoicingFilters.tsx

'use client';
import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { alpha, Box } from '@mui/material';
import dayjs from 'dayjs';

const ChipInvoicingTable = ({ rows, onSelectionChange }: any) => {
    const columns: GridColDef[] = [
        {
            field: 'scheduledDate',
            headerName: 'DATE',
            width: 120,
            valueFormatter: (params) => dayjs(params).format('DD.MM.YYYY')
        },
        { field: 'vehicleRegNo', headerName: 'VEHICLE', width: 120 },
        { field: 'customerName', headerName: 'CUSTOMER', width: 200, flex: 1 },
        { field: 'titleName', headerName: 'ITEM / TITLE', width: 180 },
        {
            field: 'actualM3',
            headerName: 'M³',
            width: 100,
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => <strong>{Number(p.value).toFixed(2)}</strong>
        },
        {
            field: 'actualTon',
            headerName: 'TONS',
            width: 100,
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => <strong>{Number(p.value).toFixed(2)}</strong>
        },
    ];

    return (
        <Box sx={{ height: 600, mt: 2 }}>
            <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(r) => r.loadId || r.id || Math.random()}
                checkboxSelection
                onRowSelectionModelChange={(ids) => onSelectionChange(ids as unknown as any[])}
                density="compact"
                sx={{
                    '& .MuiDataGrid-columnHeader': { bgcolor: alpha('#a38f6d', 0.05), fontWeight: '900' },
                    border: '1px solid #eee',
                    borderRadius: '8px'
                }}
            />
        </Box>
    );
};

export default ChipInvoicingTable;
