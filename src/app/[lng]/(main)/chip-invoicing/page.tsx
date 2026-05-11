// frontend/src/app/[lng]/(main)/chip-invoicing/page.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Stack, Backdrop, CircularProgress, Divider, TablePagination, Paper } from '@mui/material';
import chipInvoicingService from '@/services/chipInvoicingService';
import ChipInvoicingFilters from '@/components/invoicing/ChipInvoicingFilters';
import ChipInvoicingTable from '@/components/invoicing/ChipInvoicingTable';
import ChipInvoicingDialog from '@/components/invoicing/ChipInvoicingDialog';

export default function ChipInvoicingPage() {
    // --- 🚀 States ---
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectionMap, setSelectionMap] = useState<Record<string, number[]>>({});
    const [lastQuery, setLastQuery] = useState<any>(null);
    const [errorTrigger, setErrorTrigger] = useState<number>(0);

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);

    const [editOpen, setEditOpen] = useState(false);
    const [editRow, setEditRow] = useState<any>(null);

    useEffect(() => {

        setRows([]);
        setSelectionMap({});
        sessionStorage.removeItem('chip_filters');
        setLastQuery(null);

    }, []);

    const handleSearch = async (params: any) => {
        setLoading(true);
        setLastQuery(params);
        setPage(0);
        setRows([]);
        setSelectionMap({});

        try {
            const data = await chipInvoicingService.search(params);
            setRows(data);
        } catch (e) {
            console.error("Search error:", e);
        } finally {
            setLoading(false);
        }
    };
    const handleConfirmInvoice = async () => {
        const allSelectedIds = Object.values(selectionMap).flat() as number[];
        if (allSelectedIds.length === 0) return;

        const selectedRowsData = rows.filter(r => allSelectedIds.includes(r.loadId));
        const hasInvalidRows = selectedRowsData.some(r => Number(r.total || 0) === 0);

        if (hasInvalidRows) {
            setErrorTrigger(prev => prev + 1);
            return;
        }

        if (!window.confirm(`Are you sure you want to invoice ${allSelectedIds.length} loads?`)) return;

        setLoading(true);
        try {
            await chipInvoicingService.confirm(allSelectedIds);
            setSelectionMap({});
            await handleSearch(lastQuery);
            alert("Success: Selected loads marked as Billed.");
        } catch (e) {
            console.error(e);
            alert("An error occurred during invoicing.");
        } finally {
            setLoading(false);
        }
    };

    // 3. Edit Dialog Handlers
    const handleOpenEdit = (row: any) => {
        setEditRow(row);
        setEditOpen(true);
    };

    const handleSaveEdit = async (id: number, updatedData: any) => {
        try {
            setLoading(true);
            await chipInvoicingService.update(id, updatedData);
            setEditOpen(false);
            // Refresh data
            const data = await chipInvoicingService.search(lastQuery);
            setRows(data);
        } catch (e) {
            console.error("Update error:", e);
        } finally {
            setLoading(false);
        }
    };

    // 4. Report Dialog Handlers
    const handleOpenReport = () => {
        const allSelectedIds = Object.values(selectionMap).flat() as number[];

        if (allSelectedIds.length === 0) {
            alert("Please select at least one group to generate a report.");
            return;
        }

        const selectedData = rows.filter(r => allSelectedIds.includes(r.loadId));

        sessionStorage.setItem('chipInvoicingReportData', JSON.stringify(selectedData));

        const url = window.location.pathname + '/report';
        window.open(url, '_blank');
    };
    const paginatedRows = useMemo(() => {
        const start = page * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    useEffect(() => {
        const saved = sessionStorage.getItem('chip_filters');
        if (saved) {
            handleSearch(JSON.parse(saved));
        }
    }, []);

    return (
        <Box sx={{
            p: { xs: 2, md: 4 },
            height: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Stack spacing={3} sx={{ flex: 1, overflow: 'hidden' }}>

                {/* Header Section */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#a38f6d', letterSpacing: 1 }}>
                        CHIP TRANSPORT INVOICING
                    </Typography>

                    {rows.length > 0 && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="large"
                                        onClick={handleConfirmInvoice}
                                        disabled={Object.values(selectionMap).flat().length === 0}
                                        sx={{ fontWeight: 'bold', px: 4 }}
                                    >
                                        CONFIRM & INVOICE ({Object.values(selectionMap).flat().length})
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        onClick={handleOpenReport}
                                        disabled={Object.values(selectionMap).flat().length === 0}
                                        sx={{ fontWeight: 'bold', color: '#fff', px: 4, ml: 1, bgcolor: '#b38c5aea' }}
                                    >
                                        REPORT
                                    </Button>
                                </Box>
                            </Box>
                        </>
                    )}
                </Stack>

                {/* Filters Section */}
                <ChipInvoicingFilters onSubmit={handleSearch} loading={loading} initialValues={lastQuery} />

                {/* Results Section (Scrollable) */}
                <Box sx={{
                    flex: 1,
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': { width: '8px' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#e0e0e0', borderRadius: '10px' }
                }}>
                    {rows.length > 0 ? (
                        <ChipInvoicingTable
                            rows={paginatedRows}
                            selectionMap={selectionMap}
                            errorTrigger={errorTrigger}
                            onEdit={handleOpenEdit}
                            onSelectionChange={(key: string, ids: number[] | null) => {
                                const newMap = { ...selectionMap };
                                if (ids) {
                                    newMap[key] = ids;
                                } else {
                                    delete newMap[key];
                                }
                                setSelectionMap(newMap);
                            }}
                        />
                    ) : !loading && (
                        <Paper variant="outlined" sx={{ p: 8, textAlign: 'center', border: '1px dashed #ccc', bgcolor: 'background.paper' }}>
                            <Typography color="text.secondary">No records found. Please adjust filters and search.</Typography>
                        </Paper>
                    )}
                </Box>

                {/* Sticky Pagination Bar */}
                {rows.length > 0 && (
                    <Paper
                        elevation={4}
                        sx={{
                            position: 'sticky',
                            bottom: 0,
                            zIndex: 10,
                            borderRadius: '8px 8px 0 0',
                            border: '1px solid #e0e0e0',
                            bgcolor: '#fff',
                            mt: 'auto'
                        }}
                    >
                        <TablePagination
                            component="div"
                            count={rows.length}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={pageSize}
                            onRowsPerPageChange={(e) => {
                                setPageSize(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                        />
                    </Paper>
                )}
            </Stack>

            {/* Dialogs */}
            <ChipInvoicingDialog
                open={editOpen}
                row={editRow}
                onClose={() => setEditOpen(false)}
                onSave={handleSaveEdit}
            />

            {/* Global Loader */}
            <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
}