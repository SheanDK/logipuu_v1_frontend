// frontend/src/app/[lng]/(main)/chip-invoicing/page.tsx

'use client';
import React, { useCallback, useState } from 'react';
// Stack එක මෙහිදී අනිවාර්යයෙන් import කරන්න
import { Paper, Typography, Box, CircularProgress, Button, Divider, Alert, Stack } from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';
import chipInvoicingService from '@/services/chipInvoicingService';
import ChipInvoicingTable from '@/components/invoicing/ChipInvoicingTable';
import ChipInvoicingFilters from '@/components/invoicing/ChipInvoicingFilters';

export default function ChipInvoicingPage() {
    const { t } = useTranslation(['chipInvoicing', 'common']);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [selection, setSelection] = useState([]);

    const handleFiltersSubmit = useCallback(async (params: any) => {
        setLoading(true);
        try {
            const data = await chipInvoicingService.search(params);
            setRows(data);
            setShowFilters(false);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInvoiceSelected = async () => {
        if (selection.length === 0) return;
        try {
            await chipInvoicingService.markAsBilled(selection);
            setSelection([]);
            alert("Successfully Invoiced!");
            setShowFilters(true);
        } catch (error) { console.error(error); }
    };

    return (
        <Paper sx={{ p: 3, width: '100%', minHeight: '80vh' }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                Chip Transport Invoicing
            </Typography>

            {showFilters ? (
                <ChipInvoicingFilters onSubmit={handleFiltersSubmit} loading={loading} />
            ) : (
                <>
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }} justifyContent="space-between">
                        <Button variant="outlined" onClick={() => setShowFilters(true)}>Back to Filters</Button>
                        <Button variant="contained" color="success" onClick={handleInvoiceSelected} disabled={selection.length === 0}>
                            Invoice Selected ({selection.length})
                        </Button>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <ChipInvoicingTable rows={rows} onSelectionChange={setSelection} />
                </>
            )}
        </Paper>
    );
}