'use client';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  Paper, Typography, Alert, Box, CircularProgress,
  Button, Backdrop, Stack, TablePagination, alpha, useTheme,
  Snackbar
} from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';
import {
  searchConsignments, updateConsignment,
  deleteManyConsignments, invoiceConsignments,
} from '@/services/consignmentService';
import type { BillingRow } from '@/services/invoicingService';
import ConsignmentBillingFilters, { type ConsigmentSearchParams } from '@/components/invoicing/ConsignmentBillingFilter';
import ConsigmentBillingTablesByDate from '@/components/invoicing/ConsigmentBillingTable';
import ConsignmentInvoicingDialog from '@/components/invoicing/ConsignmentBillingDialog';
import { GridRowId } from '@mui/x-data-grid';
import { useParams } from 'next/navigation';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';

/** Helper: Calculate total for validation */
const num = (v: any) => Number(v ?? 0);
const computeRowTotalLocal = (row: any) => {
  const part = (num(row.quantityM3) * num(row.unitPriceM3 || row.unitPrice)) +
    (num(row.km) * num(row.unitPriceKm)) +
    (num(row.pieces) * num(row.unitPricePiece)) +
    (num(row.hours) * num(row.unitPriceHour));
  return part + num(row.roadTax || row.tievero);
};

export default function ConsignmentBillingPage() {
  const { t } = useTranslation(['consigmentBillingPage', 'common']);
  const theme = useTheme();
  const params = useParams();

  // --- States ---
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<GridRowId[]>([]);
  const [lastQuery, setLastQuery] = useState<ConsigmentSearchParams | null>(null);
  const [reloading, setReloading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Validation & UI States
  const [errorTrigger, setErrorTrigger] = useState<number>(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

  // Dialog States
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<BillingRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIds, setConfirmIds] = useState<GridRowId[]>([]);
  const [invoiceConfirmOpen, setInvoiceConfirmOpen] = useState(false);
  const [pendingKuormaIds, setPendingKuormaIds] = useState<number[]>([]);

  const handleSearch = useCallback(async (queryParams: ConsigmentSearchParams) => {
    setLoading(true);
    setLastQuery(queryParams);
    setPage(0);
    try {
      const data = await searchConsignments(queryParams);
      setRows(data);
      setSelection([]);
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial mount: Reset rows but keep filters in memory
  useEffect(() => {
    setRows([]);
    setSelection([]);
    const saved = sessionStorage.getItem('consignment_filters');
    if (saved) setLastQuery(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (lastQuery) sessionStorage.setItem('consignment_filters', JSON.stringify(lastQuery));
  }, [lastQuery]);

  const paginatedRows = useMemo(() => {
    const start = page * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const handleOpenEdit = useCallback((row: BillingRow) => {
    setEditRow(row);
    setEditOpen(true);
  }, []);

  const handleRequestDelete = useCallback((_dayKey: string, ids: GridRowId[]) => {
    setConfirmIds(ids);
    setConfirmOpen(true);
  }, []);

  const runDelete = async () => {
    setConfirmOpen(false);
    setReloading(true);
    try {
      const numericIds = confirmIds.map(id => Number(id));
      await deleteManyConsignments(numericIds);
      setRows(prev => prev.filter(r => !confirmIds.includes(r.id)));
      setSnackbar({ open: true, message: "Deleted successfully", severity: 'success' });
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: "Delete failed", severity: 'error' });
    } finally {
      setReloading(false);
    }
  };

  const handleInvoiceSelected = useCallback(async () => {
    const selSet = new Set(selection as (string | number)[]);
    const used = rows.filter((r) => selSet.has(r.id));

    // 🚀 Validation: Check for "No Price" rows (Total 0)
    const invalidRows = used.filter(r => {
      const isBilled = r.billed || !!r.billedDate;
      const total = num(r.total || computeRowTotalLocal(r));
      return !isBilled && total === 0;
    });

    if (invalidRows.length > 0) {
      setErrorTrigger(prev => prev + 1); // Trigger blink
      return;
    }

    const kuormaIds = Array.from(new Set(used.map(r => r.kuormaId).filter(id => !!id))) as number[];
    if (kuormaIds.length === 0) return;

    setPendingKuormaIds(kuormaIds);
    setInvoiceConfirmOpen(true);
  }, [selection, rows]);

  const runInvoice = async () => {
    setInvoiceConfirmOpen(false);
    setReloading(true);
    try {
      const res = await invoiceConsignments(pendingKuormaIds);
      const billedIds = new Set(res.updatedKuormaIds);
      const billedDate = res.billedDate || new Date().toISOString().split('T')[0];

      // Fast UI Update (State Patching)
      setRows(prev => prev.map((r: any) =>
        billedIds.has(Number(r.kuormaId)) ? { ...r, billed: true, billedDate } : r
      ));

      setSelection([]);
      setSnackbar({ open: true, message: "Invoicing successful!", severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: "Invoicing failed", severity: 'error' });
    } finally {
      setReloading(false);
    }
  };

  return (
    <Box sx={{
      p: { xs: 2, md: 4 },
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      <Stack spacing={3} sx={{ flex: 1, overflow: 'hidden' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#a38f6d', letterSpacing: 1 }}>
            {t('consigmentBillingPage:title').toUpperCase()}
          </Typography>
          {rows.length > 0 && (
            <Stack direction="row" spacing={1}>
              <Button variant="contained" color="success" onClick={handleInvoiceSelected} disabled={selection.length === 0} sx={{ fontWeight: 'bold' }}>
                INVOICE SELECTED ({selection.length})
              </Button>
              <Button variant="contained" onClick={() => {
                const used = rows.filter(r => new Set(selection).has(r.id));
                localStorage.setItem('consigmentBillingReportData', JSON.stringify(used));
                window.open(`/${params.lng}/consignment-invoicing/report`, '_blank');
              }} disabled={selection.length === 0} sx={{ bgcolor: '#b38c5aea', color: '#fff', fontWeight: 'bold' }}>
                REPORT
              </Button>
            </Stack>
          )}
        </Stack>

        <ConsignmentBillingFilters onSubmit={handleSearch} loading={loading} initialValues={lastQuery} />

        <Box sx={{
          flex: 1, overflowY: 'auto', pr: 0.5,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.text.primary, 0.1), borderRadius: '10px' }
        }}>
          {loading && rows.length === 0 ? (
            <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress sx={{ color: '#a38f6d' }} /></Stack>
          ) : rows.length > 0 ? (
            <ConsigmentBillingTablesByDate
              rows={paginatedRows}
              onEdit={handleOpenEdit}
              onSelectionChange={setSelection}
              onRequestDelete={handleRequestDelete}
              errorTrigger={errorTrigger}
            />
          ) : (
            <Paper variant="outlined" sx={{ p: 8, textAlign: 'center', border: '1px dashed #ccc', bgcolor: 'background.paper' }}>
              <Typography color="text.secondary">No records found. Please adjust filters and search.</Typography>
            </Paper>
          )}
        </Box>

        {rows.length > 0 && (
          <Paper elevation={4} sx={{ position: 'sticky', bottom: 0, zIndex: 10, borderRadius: '8px 8px 0 0', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', backgroundImage: 'none' }}>
            <TablePagination component="div" count={rows.length} page={page} onPageChange={(_, n) => setPage(n)} rowsPerPage={pageSize} onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 25, 50, 100]} />
          </Paper>
        )}
      </Stack>

      <ConsignmentInvoicingDialog open={editOpen} row={editRow} onClose={() => setEditOpen(false)} onSave={async (args) => {
        try {
          setReloading(true);
          const updated = await updateConsignment(Number(args.rowId), { ...args.form, total: args.total } as any);
          setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
          setEditOpen(false);
          setSnackbar({ open: true, message: "Updated successfully", severity: 'success' });
        } catch { setSnackbar({ open: true, message: "Update failed", severity: 'error' }); }
        finally { setReloading(false); }
      }} />

      <ConfirmationDialog open={confirmOpen} title={t('common:dialogs.deleteTitle')} message={t('common:dialogs.deleteMessage')} onClose={() => setConfirmOpen(false)} onConfirm={runDelete} confirmButtonColor="error" />
      <ConfirmationDialog open={invoiceConfirmOpen} title="Confirm Invoicing" message={`Are you sure you want to invoice ${pendingKuormaIds.length} group(s)?`} onClose={() => setInvoiceConfirmOpen(false)} onConfirm={runInvoice} confirmButtonColor="success" />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', fontWeight: 'bold' }}>{snackbar.message}</Alert>
      </Snackbar>
      <Backdrop open={reloading} sx={{ zIndex: 9999, color: '#fff' }}><CircularProgress color="inherit" /></Backdrop>
    </Box>
  );
}