// frontend/src/app/[lng]/(main)/chip-invoicing/page.tsx
'use client';
import React, { useCallback, useState, useMemo } from 'react';
import { Box, Typography, Button, Stack, Backdrop, CircularProgress } from '@mui/material';
import chipInvoicingService from '@/services/chipInvoicingService';
import ChipInvoicingFilters from '@/components/invoicing/ChipInvoicingFilters';
import ChipInvoicingTable from '@/components/invoicing/ChipInvoicingTable';
import ChipInvoicingDialog from '@/components/invoicing/ChipInvoicingDialog';

interface QueryParams {
    dateFrom?: string;
    dateTo?: string;
    customerName?: string;
    vehicleName?: string;
}

export default function ChipInvoicingPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectionMap, setSelectionMap] = useState<Record<string, number[]>>({});
    const [showFilters, setShowFilters] = useState(true);
    const [lastQuery, setLastQuery] = useState<QueryParams | null>(null);
    const [invalidIds, setInvalidIds] = useState<number[]>([]);

    // Dialog States
    const [editOpen, setEditOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);

    // Live calculation of selected IDs on every render (resolves stale closures)
    const allSelectedIds = useMemo(() => {
        return Object.values(selectionMap)
            .flat()
            .map(id => Number(id))
            .filter(id => !isNaN(id) && id > 0);
    }, [selectionMap]);

    const totalSelectedCount = allSelectedIds.length;

    const handleSearch = async (params: any) => {
        setLoading(true);
        setLastQuery(params);
        try {
            const data = await chipInvoicingService.search(params);
            console.log("Frontend Data Received:", data);
            if (data.length === 0) {
                alert("No completed loads found for this range!");
            }
            setRows(data);
            setShowFilters(false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (row: any) => {
        setEditRow(row);
        setEditOpen(true);
    };

    const handleSaveEdit = async (id: number, updatedData: any) => {
        try {
            setLoading(true);
            await chipInvoicingService.update(id, updatedData);
            setEditOpen(false);

            // Refetch data using existing query parameters
            if (lastQuery) {
                const data = await chipInvoicingService.search(lastQuery);
                setRows(data);
            } else {
                const savedFilters = JSON.parse(sessionStorage.getItem('chip_filters') || '{}');
                const data = await chipInvoicingService.search(savedFilters);
                setRows(data);
            }
        } catch (e: any) {
            console.error("Save failed:", e.response?.data || e.message);
            alert("Error saving data. Please check backend logs.");
        } finally {
            setLoading(false);
        }
    };

    // Safe callback that avoids "ids.map is not a function" by wrapping inside array checks
    const handleSelectionChange = useCallback((key: string, ids: any) => {
        const cleanIds = Array.isArray(ids)
            ? ids.map(id => Number(id)).filter(n => !isNaN(n))
            : [];
        setSelectionMap(prev => ({
            ...prev,
            [key]: cleanIds
        }));
    }, []);

    const handleConfirmInvoice = async () => {
        console.log("Sending Selected IDs to Backend:", allSelectedIds);

        if (allSelectedIds.length === 0) {
            alert("Please select at least one load.");
            return;
        }

        // Validate that all selected rows have prices added (total > 0)
        const selectedRows = rows.filter((r: any) => allSelectedIds.includes(Number(r.loadId)));
        const missingPriceIds = selectedRows
            .filter((r: any) => Number(r.total || 0) <= 0)
            .map((r: any) => r.loadId);

        if (missingPriceIds.length > 0) {
            setInvalidIds(missingPriceIds);
            alert(`Cannot invoice! ${missingPriceIds.length} load(s) are missing prices. Missing serials highlighted in red.`);
            return;
        }

        if (!window.confirm(`Mark ${totalSelectedCount} selected load(s) as Billed?`)) return;

        setLoading(true);
        try {
            await chipInvoicingService.confirm(allSelectedIds);
            alert("Loads successfully marked as Billed!");
            setSelectionMap({}); // Reset selection map upon success
            setInvalidIds([]);   // Clear any active validation highlights

            // Refresh table with fresh data
            if (lastQuery) {
                const data = await chipInvoicingService.search(lastQuery);
                setRows(data);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to confirm. Please check backend log details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#a38f6d' }}>
                    Chip Transport Invoicing
                </Typography>

                {showFilters ? (
                    <ChipInvoicingFilters onSubmit={handleSearch} loading={loading} initialValues={lastQuery} />
                ) : (
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={2} justifyContent="space-between">
                            <Button variant="outlined" onClick={() => setShowFilters(true)}>Back to Filters</Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleConfirmInvoice}
                                disabled={totalSelectedCount === 0 || loading}
                                sx={{
                                    bgcolor: totalSelectedCount > 0 ? '#2e7d32' : 'action.disabledBackground',
                                    fontWeight: 'bold',
                                    px: 4
                                }}
                            >
                                CONFIRM & INVOICE SELECTED ({totalSelectedCount})
                            </Button>
                        </Stack>
                        <ChipInvoicingTable
                            rows={rows}
                            invalidIds={invalidIds}
                            onEdit={handleOpenEdit}
                            onSelectionChange={handleSelectionChange}
                        />
                    </Stack>
                )}
            </Stack>

            {/* Edit Dialog */}
            <ChipInvoicingDialog
                open={editOpen}
                row={editRow}
                onClose={() => setEditOpen(false)}
                onSave={handleSaveEdit}
            />

            <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
}