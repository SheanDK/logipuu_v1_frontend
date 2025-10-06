'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Paper, Typography, Alert, Divider, Box, CircularProgress, Button, Backdrop } from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';
import { searchConsignments, createConsignment, updateConsignment, deleteManyConsignments, invoiceConsignments } from '@/services/consignmentService';
import type { BillingRow } from '@/services/invoicingService';
import ConsignmentBillingFilters, { type ConsigmentSearchParams } from '@/components/invoicing/ConsignmentBillingFilter';
import ConsigmentBillingTablesByDate from '@/components/invoicing/ConsigmentBillingTable';
import ConsignmentInvoicingDialog from '@/components/invoicing/ConsignmentBillingDialog';
import { GridRowId } from '@mui/x-data-grid';
import { useParams, useRouter } from 'next/navigation';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';

/* -----------------------------------------------------------------------------
 * ConsignmentBillingPage
 * - Hosts the search filters, grouped tables, and edit/invoice/report flows
 * - Manages selection, feedback toasts, and confirm-delete dialog
 * ---------------------------------------------------------------------------*/
export default function ConsignmentBillingPage() {
  const { t } = useTranslation(['consigmentBillingPage', 'common']);

  // UI state
  const [showFilters, setShowFilters] = useState(true);
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<BillingRow | null>(null);
  const [dialogDirty, setDialogDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  // Selection state (DataGrid)
  const [selection, setSelection] = useState<GridRowId[]>([]);
  const [tableKey, setTableKey] = useState(0); // forces DataGrid remount on new search
  const [selectedIds, setSelectedIds] = useState<GridRowId[]>([]); // reserved if you later need global selected ids

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIds, setConfirmIds] = useState<GridRowId[]>([]);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMsg, setConfirmMsg] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Query cache + background reload
  const [lastQuery, setLastQuery] = useState<ConsigmentSearchParams | null>(null);
  const [reloading, setReloading] = useState(false);

  const router = useRouter();
  const params = useParams();

  /** Safe numeric cast with default. */
  const num = (v: any, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  /** Handle filters submit: fetch consignments and render results or show “no results”. */
  const handleFiltersSubmit = useCallback(
    async (params: ConsigmentSearchParams) => {
      setFeedback(null);
      setLoading(true);
      setLastQuery(params);

      try {
        const data = await searchConsignments({
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          customerId: params.customerId ?? null,
          vehicleId: params.vehicleId ?? null,
          unbilled: params.unbilled,
          billed: params.billed,
        });

        if (!data.length) {
          setRows([]);
          setFeedback({ type: 'success', message: t('consigmentBillingPage:messages.noResults') });
          setShowFilters(true);
          return;
        }
        setRows(data);
        setSelection([]);
        setTableKey((k) => k + 1);
        setShowFilters(false);
      } catch (e: any) {
        setFeedback({ type: 'error', message: e?.message ?? t('consigmentBillingPage:messages.searchFailed') });
        setShowFilters(true);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  /** Re-run last search (used after destructive actions). */
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
    if (
      editRow &&
      !(typeof editRow.id === 'string' && editRow.id.startsWith('temp-'))
    ) {
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.id === editRow.id);
        if (idx === -1) return prev;
        const current = prev[idx] as any;
        if (!current?.changed) return prev;
        const copy = [...prev];
        copy[idx] = { ...current, changed: false };
        return copy;
      });
    }
    setEditOpen(false);
    setEditRow(null);
    setDialogDirty(false);
  }, [editRow, setRows]);

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
      const current = prev[idx] as any;
      if (current?.changed === dirty) return prev;
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
  const handleSaveEdit = useCallback(
    async ({ rowId, form, total }: any) => {
      try {
        const isTemp = typeof rowId === 'string' && rowId.startsWith('temp-');

        const dto = {
          date: form.pvm,
          waybillNumber: form.rahtikirjanNro,
          route: form.ajoreitti,
          notes: form.lisatiedot,
          quantityM3: num(form.maaraM3),
          unitPriceM3: num(form.hintaM3),
          km: num(form.km),
          unitPriceKm: num(form.hintaKm),
          hours: num(form.jakoTunnit),
          unitPriceHour: num(form.hintaJakoTunti),
          pieces: num(form.kpl),
          unitPricePiece: num(form.hintaKpl),
          roadTax: num(form.tievero),
          total: num(total),
        };

        if (isTemp) {
          const src = rows.find((r) => r.id === rowId) ?? editRow;
          const kuormaId = num((src as any)?.kuormaId, NaN);

          if (!Number.isFinite(kuormaId)) {
            throw new Error('kuormaId puuttuu uudelta riviltä. (Ei voida tehdä POSTia)');
          }
          const created = await createConsignment({ ...dto, kuormaId });
          setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === rowId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = created as BillingRow;
              return copy;
            }
            return [...prev, created as BillingRow];
          });
        } else {
          const idNum = num(rowId, NaN);
          if (!Number.isFinite(idNum)) throw new Error('Virheellinen rivin id (ei-numero).');
          const updated = await updateConsignment(idNum, dto);
          setRows((prev) =>
            prev.map((r) => (r.id === updated.id ? ({ ...updated, changed: false } as BillingRow) : r))
          );
        }

        setSelection([]);
        setDialogDirty(false);
        setEditOpen(false);
        setEditRow(null);
        setDiscardConfirmOpen(false);
        setFeedback({ type: 'success', message: t('consigmentBillingPage:messages.saveOk') || 'Tallennettu.' });
      } catch (err: any) {
        console.error('[FE][SAVE][ERR]', err);
        setFeedback({ type: 'error', message: err?.message ?? t('consigmentBillingPage:messages.updateFailed') });
      }
    },
    [rows, editRow, t]
  );


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
      const kuormaIds = Array.from(
        new Set(used.map((r: any) => r.kuormaId).filter((id: any) => Number.isFinite(Number(id))))
      ) as Array<number | string>;

      if (kuormaIds.length === 0) {
        setFeedback({ type: 'error', message: t('consigmentBillingPage:messages.noResults') });
        return;
      }

      setReloading(true);
      try {
        const res = await invoiceConsignments(kuormaIds);

        // Update FE statuses immediately
        const billedISO = res.billedDate || new Date().toISOString().slice(0, 10);
        const updatedSet = new Set(res.updatedKuormaIds);
        setRows((prev) =>
          prev.map((r: any) =>
            updatedSet.has(Number(r.kuormaId)) ? { ...r, billed: true, billedDate: billedISO, changed: false } : r
          )
        );

        // Build feedback message from response counts
        const parts: string[] = [];
        if (res.updated) parts.push(t('consigmentBillingPage:feedback.invoiced', { count: res.updated }));
        if (res.alreadyBilled) parts.push(t('consigmentBillingPage:feedback.already', { count: res.alreadyBilled }));
        if (res.notFound) parts.push(t('consigmentBillingPage:feedback.notFound', { count: res.notFound }));
        setFeedback({ type: 'success', message: parts.join('. ') || t('common:messages.ok') });

        // Reset selection
        setSelection([]);
      } catch (e: any) {
        setFeedback({ type: 'error', message: e?.message ?? t('consigmentBillingPage:messages.invoiceFailed') });
      } finally {
        setReloading(false);
      }
    },
    [selection, rows, t]
  );

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
  const handleRequestDelete = useCallback(
    (dayKey: string, ids: GridRowId[]) => {
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
        // Remove temp-rows only on FE; send numeric ids to BE
        const numericIds = confirmIds.filter((id) => !String(id).startsWith('temp-'));
        const tempIds = new Set(confirmIds.filter((id) => String(id).startsWith('temp-')).map(String));

        const res = await deleteManyConsignments(numericIds);

        // Filter out from FE all successfully deleted + temps
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
      } catch (e: any) {
        setFeedback({ type: 'error', message: e?.message ?? t('common:messages.error') });
      } finally {
        setIsConfirming(false);
        setConfirmOpen(false);
        setConfirmIds([]);
      }

      setReloading(true);
      try {
        await refetch();
      } finally {
        setReloading(false);
      }
    },
    [confirmIds, rows, t]
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
