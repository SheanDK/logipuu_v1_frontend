// frontend/src/components/invoicing/ChipInvoicingFilters.tsx

'use client';
import React, { useState } from 'react';
import { Box, TextField, Button, Stack, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const ChipInvoicingFilters = ({ onSubmit, loading }: any) => {
    const [filters, setFilters] = useState({
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        billed: false
    });

    return (
        <Stack direction="row" spacing={2} alignItems="center">
            <TextField label="From" type="date" size="small" InputLabelProps={{ shrink: true }} value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
            <TextField label="To" type="date" size="small" InputLabelProps={{ shrink: true }} value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
            <TextField select label="Status" size="small" sx={{ width: 150 }} value={filters.billed} onChange={(e) => setFilters({ ...filters, billed: e.target.value === 'true' })}>
                <MenuItem value="false">Unbilled</MenuItem>
                <MenuItem value="true">Billed</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={loading ? null : <SearchIcon />} onClick={() => onSubmit(filters)} disabled={loading} sx={{ bgcolor: '#a38f6d' }}>
                {loading ? 'Searching...' : 'Search'}
            </Button>
        </Stack>
    );
};

export default ChipInvoicingFilters;