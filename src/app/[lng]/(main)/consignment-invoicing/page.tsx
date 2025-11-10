// src/app/[lng]/(main)/consignment-invoicing/page.tsx
'use client';
import React, { useCallback, useState } from 'react'; 
import { Paper, Typography, Alert, Divider, Box, CircularProgress, Button, Backdrop, AlertColor } from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';
import { searchConsignments, createConsignment, updateConsignment, deleteManyConsignments, invoiceConsignments, UpsertConsignmentDto } from '@/services/consignmentService';
import type { BillingRow } from '@/services/invoicingService';
import ConsignmentBillingFilters, { type ConsigmentSearchParams } from '@/components/invoicing/ConsignmentBillingFilter';
import ConsigmentBillingTablesByDate from '@/components/invoicing/ConsigmentBillingTable';
import ConsignmentInvoicingDialog from '@/components/invoicing/ConsignmentBillingDialog';
import { GridRowId } from '@mui/x-data-grid';
import { useParams, useRouter } from 'next/navigation';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import axios from 'axios'; // Keep for error checking

type BillingRowWithState = BillingRow & { changed?: boolean };

// Define an interface for the form data used in handleSaveEdit
export interface EditForm {
    pvm: string | null;
    rahtikirjanNro: string | null;
    ajoreitti: string | null;
    lisatiedot: string | null;
    // These fields should be numbers as they represent numeric values
    maaraM3: number;
    hintaM3: number;
    km: number;
    hintaKm: number;
    jakoTunnit: number;
    hintaJakoTunti: number;
    kpl: number;
    hintaKpl: number;
    tievero: number;
}

export default function ConsignmentBillingPage() {
  const { t } = useTranslation(['consigmentBillingPage', 'common']);

  // --- THE FIX IS HERE: All useState hooks are now correctly defined ---
  const [showFilters, setShowFilters] = useState(true);
  const [rows, setRows] = useState<BillingRowWithState[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<BillingRow | null>(null);
  const [dialogDirty, setDialogDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [selection, setSelection] = useState<GridRowId[]>([]);
  const [tableKey, setTableKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIds, setConfirmIds] = useState<GridRowId[]>([]);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMsg, setConfirmMsg] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [lastQuery, setLastQuery] = useState<ConsigmentSearchParams | null>(null);
  const [reloading, setReloading] = useState(false);
  // --- END OF FIX ---

  const router = useRouter();
  const params = useParams();

  const num = (v: string | number | null | undefined, d = 0): number => {
    if (v === null || v === undefined || v === '') return d;
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  const handleFiltersSubmit = useCallback(async (queryParams: ConsigmentSearchParams) => {
      setFeedback(null);
      setLoading(true);
      setLastQuery(queryParams);
      try {
        const data = await searchConsignments({
          dateFrom: queryParams.dateFrom,
          dateTo: queryParams.dateTo,
          customerId: queryParams.customerId ?? null,
          vehicleId: queryParams.vehicleId ?? null,
          unbilled: queryParams.unbilled,
          billed: queryParams.billed,
        });
        if (!data.length) {
          setRows([]);
          setFeedback({ type: 'success', message: t('messages.noResults') });
          setShowFilters(true);
        } else {
          setRows(data);
          setSelection([]);
          setTableKey((k) => k + 1);
          setShowFilters(false);
        }
      } catch (e: unknown) {
        const message = axios.isAxiosError(e) ? e.response?.data?.message : (e instanceof Error ? e.message : t('messages.searchFailed'));
        setFeedback({ type: 'error', message: message || t('messages.searchFailed') });
        setShowFilters(true);
      } finally {
        setLoading(false);
      }
    }, [t]
  );

  const refetch = useCallback(async () => {
    if (!lastQuery) return;
    setLoading(true);
    try {
      const data = await searchConsignments(lastQuery);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [lastQuery]);

  /** Return to filters view and reset edit/selection states. */
  const handleBackToFilters = useCallback(() => {
    setShowFilters(true);
    setEditOpen(false);
    setEditRow(null);
    setDialogDirty(false);
    setDiscardConfirmOpen(false);
    setSelection([]);
  }, []);

  /** Open/close edit dialog. */
  const handleOpenEdit = useCallback((row: BillingRow) => {
    setEditRow(row);
    setEditOpen(true);
    setDialogDirty(false);
  }, []);

  const handleRequestAddRow = useCallback(
    ({ row }: { group: unknown; row: BillingRow }) => {
      setEditRow(row);
      setEditOpen(true);
      setDialogDirty(false);
    },
    []
  );

  const finalizeCloseEdit = useCallback(() => {
    if (editRow && !(typeof editRow.id === 'string' && editRow.id.startsWith('temp-'))) {
        setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === editRow.id);
            if (idx === -1) return prev;
            const current = prev[idx];
            if (!current.changed) return prev;
            const copy = [...prev];
            copy[idx] = { ...current, changed: false }; // This is now valid
            return copy;
        });
    }
    setEditOpen(false);
    setEditRow(null);
    setDialogDirty(false);
  }, [editRow]);

  const handleCloseEdit = useCallback(() => {
    if (dialogDirty) {
      setDiscardConfirmOpen(true);
    } else {
      finalizeCloseEdit();
    }
  }, [dialogDirty, finalizeCloseEdit]);

  const handleConfirmDiscard = useCallback(() => {
    setDiscardConfirmOpen(false);
    finalizeCloseEdit();
  }, [finalizeCloseEdit]);

  const handleCancelDiscard = useCallback(() => {
    setDiscardConfirmOpen(false);
  }, []);

  /** Reflect dialog dirty-state on the corresponding row (drives "changed" chip). */
   const handleDialogDirty = useCallback((
    { rowId, dirty }: { rowId: BillingRow['id']; dirty: boolean }
  ) => {
    setDialogDirty(dirty);
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      if (idx === -1) return prev;
      const current = prev[idx]; // No need for 'any' cast
      if (current.changed === dirty) return prev;
      const copy = [...prev];
      copy[idx] = { ...current, changed: dirty };
      return copy;
    });
  }, []);

  /**
   * Persist edits:
   * - If temp row (id starts with "temp-"), create via POST
   * - Otherwise PATCH existing row
   * - Update local list in-place; clear selection and close dialog
   */
   const handleSaveEdit = useCallback(async ({ rowId }: { rowId: BillingRow['id'], form: EditForm, total: number }) => {
    try {
        const isTemp = typeof rowId === 'string' && rowId.startsWith('temp-');
        const dto: UpsertConsignmentDto = {
          date: ''
        };

        if (isTemp) {
            const src = rows.find((r) => r.id === rowId) ?? editRow;
            // FIX: Type 'src' to avoid implicit any
            const kuormaId = num((src as BillingRow & { kuormaId?: number })?.kuormaId, NaN);
            if (!Number.isFinite(kuormaId)) { throw new Error('kuormaId not found for new row.'); }
            const created = await createConsignment({ ...dto, kuormaId });
            setRows((prev) => prev.map(r => r.id === rowId ? created as BillingRow : r));
        } else {
            const originalRow = rows.find(r => r.id === rowId);
            if (!originalRow) { throw new Error("Could not find the original row to update."); }
            // FIX: Type 'originalRow' to avoid implicit any
            const idForUpdate = num((originalRow as BillingRow & { kuormaId?: number }).kuormaId, NaN); 
            if (!Number.isFinite(idForUpdate)) { throw new Error('Invalid ID format for update.'); }
            const updated = await updateConsignment(idForUpdate, dto);
            setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...updated, changed: false } as BillingRow : r)));
        }
        finalizeCloseEdit();
        setFeedback({ type: 'success', message: t('messages.saveOk') });
    } catch (err: unknown) {
        const message = axios.isAxiosError(err) && err.response ? (err.response.data as { message: string }).message : (err instanceof Error ? err.message : t('messages.updateFailed'));
        setFeedback({ type: 'error', message: message || t('messages.updateFailed') });
    }
  }, [rows, editRow, t, finalizeCloseEdit]);

  /**
   * Invoice action:
   * - Use selected rows if any; otherwise invoice all current rows
   * - Back-end invoices at “kuormaId” granularity -> collect unique IDs
   * - Optimistically mark updated rows as billed with billedDate (from API or today)
   */
  const handleInvoiceSelected = useCallback(
    async () => {
      // Gather selected rows (or all rows if nothing is selected)
      const selSet = new Set(selection as (string | number)[]);
      const used = selection.length > 0 ? rows.filter((r) => selSet.has(r.id)) : rows;

      // Invoice is performed per load (kuorma) -> extract unique kuormaIds
      const kuormaIds = Array.from(new Set(used.map((r: BillingRow & { kuormaId?: number }) => r.kuormaId).filter((id) => Number.isFinite(Number(id))))) as number[];

      if (kuormaIds.length === 0) {
        setFeedback({ type: 'error', message: t('consigmentBillingPage:messages.noResults') });
        return;
      }

      setReloading(true);
      try {
        const res: { billedDate?: string; updatedKuormaIds: number[]; updated?: number; alreadyBilled?: number; notFound?: number; } = await invoiceConsignments(kuormaIds);
      const billedISO = res.billedDate || new Date().toISOString().slice(0, 10);
      const updatedSet = new Set(res.updatedKuormaIds);
        setRows((prev) => prev.map((r: BillingRow & { kuormaId?: number }) => updatedSet.has(Number(r.kuormaId)) ? { ...r, billed: true, billedDate: billedISO, changed: false } : r));

        // Build feedback message from response counts
        const parts: string[] = [];
        if (res.updated) parts.push(t('consigmentBillingPage:feedback.invoiced', { count: res.updated }));
        if (res.alreadyBilled) parts.push(t('consigmentBillingPage:feedback.already', { count: res.alreadyBilled }));
        if (res.notFound) parts.push(t('consigmentBillingPage:feedback.notFound', { count: res.notFound }));
        setFeedback({ type: 'success', message: parts.join('. ') || t('common:messages.ok') });

        // Reset selection
        setSelection([]);
    } catch (e: unknown) { // FIX: Use unknown for error
        const message = axios.isAxiosError(e) && e.response ? (e.response.data as { message: string }).message : (e instanceof Error ? e.message : String(e));
        setFeedback({ type: 'error', message: message || t('messages.invoiceFailed') });
    } finally {
        setReloading(false);
    }
  }, [selection, rows, t]);
  /**
   * Build a print-friendly dataset and navigate to the report page.
   * - If some rows are selected, only those go to the report.
   * - If no selection, all current result rows are used.
   * - Data is stored in localStorage for the /consignment-invoicing/report page to read.
   */
  const handleOpenReport = useCallback(() => {
    const selSet = new Set(selection as (string | number)[]);
    const used = selection.length > 0 ? rows.filter((r) => selSet.has(r.id)) : rows;

    if (!used.length) {
      setFeedback({ type: 'error', message: t('consigmentBillingPage:messages.noRowsForReport') });
      return;
    }

    // Persist the dataset; report component reads it directly
    localStorage.setItem('consigmentBillingReportData', JSON.stringify(used));
    router.push(`/${params.lng}/consignment-invoicing/report`);
  }, [rows, selection, t, router, params.lng]);

  /** Ask for delete confirmation for the given ids (copy text based on the count). */
  const handleRequestDelete = useCallback((_dayKey: string, ids: GridRowId[]) => {
      const n = ids.length;
      setConfirmIds(ids);
      setConfirmTitle(t('consigmentBillingPage:confirm.deleteTitle', { defaultValue: 'Poista rivit' }));
      setConfirmMsg(
        n === 1
          ? t('consigmentBillingPage:confirm.deleteOne', { defaultValue: 'Haluatko varmasti poistaa valitun rivin?' })
          : t('consigmentBillingPage:confirm.deleteMany', { count: n, defaultValue: `Haluatko varmasti poistaa ${n} riviä?` })
      );
      setConfirmOpen(true);
    },
    [t]
  );

  /**
   * Execute deletion for confirmed ids:
   * - Temp rows are removed only on FE; numeric ids go to BE
   * - Compose success message with counts (deleted / billed / not found)
   * - Finally refresh the dataset with the last query
   */
  const runDelete = useCallback(
    async () => {
      setIsConfirming(true);
      try {
        const numericIds = confirmIds.filter((id) => !String(id).startsWith('temp-')) as number[];
        const tempIds = new Set(confirmIds.filter((id) => String(id).startsWith('temp-')).map(String));

        // Assuming deleteManyConsignments returns an object with these properties
        const res: { deletedIds: (number | string)[]; billedIds: (number | string)[]; notFoundIds: (number | string)[] } = await deleteManyConsignments(numericIds);

        const deletedSet = new Set<number | string>([...res.deletedIds, ...Array.from(tempIds)]);
        const next = rows.filter((r) => !deletedSet.has(r.id));
        setRows(next);

        // Feedback summary
        const deletedCount = res.deletedIds.length + tempIds.size;
        const billedCount = res.billedIds.length;
        const notFoundCount = res.notFoundIds.length;

        const parts: string[] = [];
        if (deletedCount) {
          parts.push(t('consigmentBillingPage:feedback.deleted', { count: deletedCount }));
        }
        if (billedCount) {
          parts.push(t('consigmentBillingPage:feedback.cannotDeleteBilled', { count: billedCount }));
        }
        if (notFoundCount) {
          parts.push(t('consigmentBillingPage:feedback.notFound', { count: notFoundCount }));
        }

        setFeedback({ type: 'success', message: parts.join('. ') || t('common:messages.ok') });
        
      // --- THE FIX IS HERE ---
      } catch (e: unknown) {
        let errorMessage = t('common:messages.error'); // Default error message
        if (axios.isAxiosError(e) && e.response) {
            // If it's an Axios error, get the message from the response
            errorMessage = (e.response.data as { message: string }).message || errorMessage;
        } else if (e instanceof Error) {
            // If it's a standard Error object, use its message property
            errorMessage = e.message;
        }
        setFeedback({ type: 'error', message: errorMessage });
      // --- END OF FIX ---
      } finally {
        setIsConfirming(false);
        setConfirmOpen(false);
        setConfirmIds([]);
      }

      // This refetch should happen regardless of success or failure
      setReloading(true);
      try {
        await refetch();
      } finally {
        setReloading(false);
      }
    },
    [confirmIds, rows, t, refetch]
  );

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('consigmentBillingPage:title')} {/* "Consignment Invoicing" */}
      </Typography>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {showFilters && (
        <>
          <ConsignmentBillingFilters onSubmit={handleFiltersSubmit} loading={loading} initialValues={lastQuery} />
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {!showFilters && (
        <>
          {/* Top action bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Button variant="outlined" onClick={handleBackToFilters}>
              {t('common:buttons.back')}
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleInvoiceSelected} disabled={rows.length === 0}>
                {t('consigmentBillingPage:buttons.invoice')}
              </Button>
              <Button variant="contained" onClick={handleOpenReport} disabled={rows.length === 0}>
                {t('consigmentBillingPage:buttons.report')}
              </Button>
            </Box>
          </Box>

          {/* Result tables */}
          <Box sx={{ mt: 1 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ConsigmentBillingTablesByDate
                key={tableKey}
                rows={rows}
                onEdit={handleOpenEdit}
                onRowsChange={setRows}
                onSelectionChange={setSelection}
                onRequestDelete={handleRequestDelete}
                onRequestAddRow={handleRequestAddRow}
              />
            )}
          </Box>
        </>
      )}

      {/* Edit dialog */}
      <ConsignmentInvoicingDialog
        open={editOpen}
        row={editRow}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        onDirtyChange={handleDialogDirty}
      />

      {/* Confirm delete dialog */}
      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runDelete}
        isConfirming={isConfirming}
        confirmButtonColor="error"
        title={confirmTitle}
        message={confirmMsg}
      />

      <ConfirmationDialog
        open={discardConfirmOpen}
        onClose={handleCancelDiscard}
        onConfirm={handleConfirmDiscard}
        confirmButtonColor="warning"
        title={t('consigmentBillingPage:confirm.discardTitle', { defaultValue: 'Hylätäänkö muutokset?' })}
        message={t('consigmentBillingPage:confirm.discardMessage', { defaultValue: 'Tallentamattomat muutokset menetetään. Suljetaanko ilman tallennusta?' })}
        confirmButtonText={t('consigmentBillingPage:confirm.discardConfirm', { defaultValue: 'Hylkää muutokset' })}
      />

      {/* Global backdrop for long-running actions (invoicing / refresh) */}
      <Backdrop open={reloading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Paper>
  );
}
