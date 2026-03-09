// frontend/src/components/invoicing/ChipInvoicingFilters.tsx

'use client';
import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';

const ChipInvoicingTable = ({ rows, onSelectionChange }: any) => {
    const columns: GridColDef[] = [
        { field: 'scheduled_date', headerName: 'DATE', width: 120 },
        { field: 'vehicleRegNo', headerName: 'VEHICLE', width: 120 },
        { field: 'customerName', headerName: 'CUSTOMER', width: 200 },
        { field: 'title_name', headerName: 'ITEM', width: 200 },
        { field: 'actual_m3', headerName: 'M3', width: 100, type: 'number' },
        { field: 'actual_ton', headerName: 'TONS', width: 100, type: 'number' },
    ];

    return (
        <Box sx={{ height: 500, mt: 2 }}>
            <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(r) => r.load_id}
                checkboxSelection
                onRowSelectionModelChange={(ids: any) => onSelectionChange(ids)}
            />
        </Box>
    );
};

export default ChipInvoicingTable;