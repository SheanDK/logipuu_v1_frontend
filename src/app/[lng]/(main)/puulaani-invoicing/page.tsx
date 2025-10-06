'use client';

import React, { useCallback, useState } from 'react';
import { Paper, Typography, Alert, Divider, Box, CircularProgress, Button } from '@mui/material';

import { useTranslation } from '@/i18n/useTranslation';
import { invoiceBillingRows, searchInvoicing, type BillingRow as InvoicingRow } from '@/services/invoicingService';

import WoodBillingFilters, { type InvoicingSearchParams } from '@/components/invoicing/WoodBillingFilters';
import WoodBillingTable from '@/components/invoicing/WoodBillingTable';
import EditInvoicingDialog from '@/components/invoicing/WoodBillingDialog';
import { updateBillingRow } from '@/services/invoicingService';
import { GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';

type BillingRow = InvoicingRow;

export default function WoodBillingPage() {

  const { t } = useTranslation(['woodBillingPage', 'common']);

  // View state
  const [showFilters, setShowFilters] = useState(true);

  // Results + UI state
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [lastQuery, setLastQuery] = useState<InvoicingSearchParams | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<BillingRow | null>(null);

  // selection from table
  const [selection, setSelection] = useState<GridRowId[]>([]);
  const [tableKey, setTableKey] = useState(0);

  const router = useRouter();
  const params = useParams();

  /** Called by Filters when user submits the form. */
  const handleFiltersSubmit = useCallback(async (params: InvoicingSearchParams) => {
    setFeedback(null);
    setLoading(true);
    setLastQuery(params);
    try {
      const data = await searchInvoicing(params);

      if (!data.length) {
        setRows([]);
        setFeedback({ type: 'success', message: t('woodBillingPage:messages.noResults') });
        setShowFilters(true);
        return;
      }

      setRows(data);
      setSelection([]);
      setTableKey(k => k + 1);
      setShowFilters(false);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message ?? t('woodBillingPage:messages.searchFailed') });
      setShowFilters(true);
    } finally {
      setLoading(false);
    }
  }, [t]);

  /** Back to filters */
  const handleBackToFilters = useCallback(() => {
    setShowFilters(true);
    setEditOpen(false);
    setEditRow(null);
    setSelection([]);
  }, []);

  /** Open/close edit dialog */
  const handleOpenEdit = useCallback((row: BillingRow) => {
    setEditRow(row);
    setEditOpen(true);
  }, []);
  const handleCloseEdit = useCallback(() => setEditOpen(false), []);

  // Mark row as changed immediately when the dialog says it’s dirty.
  const handleDialogDirty = React.useCallback(
    ({ rowId, dirty }: { rowId: BillingRow['id']; dirty: boolean }) => {
      setRows(prev => prev.map(r => (r.id === rowId ? { ...r, changed: dirty } : r)));
    },
    []
  );

  /** Save callback from the dialog — calls PUT /api/invoicing/:id and patches local state */
  const handleSaveEdit = useCallback(
    async ({ rowId, form, total }: any) => {
      try {
        const safeTotal =
          typeof total === 'number'
            ? total
            : Number(form.maaraM3 || 0) * Number(form.hintaM3 || 0) +
            Number(form.rahtiKm || 0) * Number(form.hintaKm || 0) +
            Number(form.tunnit || 0) * Number(form.hintaTunti || 0) +
            Number(form.kpl || 0) * Number(form.hintaKpl || 0);

        const updated = await updateBillingRow(rowId, {
          waybillNumber: form.ajomaaraysNro,
          vastaanottoNro: form.vastaanottoNro,
          route: form.ajoreitti,
          notes: form.lisatiedot,

          quantityM3: form.maaraM3,
          km: form.rahtiKm,
          hours: form.tunnit,
          pieces: form.kpl,

          unitPriceM3: form.hintaM3,
          unitPriceKm: form.hintaKm,
          unitPriceHour: form.hintaTunti,
          unitPricePiece: form.hintaKpl,

          total: safeTotal,
        });

        setRows(prev => prev.map(r => (r.id === updated.id ? { ...updated, changed: true } : r)));
        setSelection([]);
        setEditOpen(false);
      } catch (err: any) {
        setFeedback({ type: 'error', message: err?.message ?? t('woodBillingPage:messages.updateFailed') });
      }
    },
    [t]
  );

  // Batch-invoice selected rows
  const handleInvoiceSelected = useCallback(async () => {
    if (selection.length === 0) return;
    try {
      const res = await invoiceBillingRows(selection);

      const todayISO = new Date().toISOString().slice(0, 10);

      // Patch local table only for ids that BE actually updated
      setRows(prev => prev.map(r =>
        res.updatedIds.includes(Number(r.id))
          ? { ...r, billed: true, billedDate: (r as any).billedDate ?? todayISO, changed: false }
          : r
      ));

      setSelection([]);

      const msgParts: string[] = [
        t('woodBillingPage:feedback.invoiced', { count: res.updated }),
      ];
      if (res.alreadyBilled > 0) {
        msgParts.push(t('woodBillingPage:feedback.already', { count: res.alreadyBilled }));
      }
      if (res.notFound > 0) {
        msgParts.push(t('woodBillingPage:feedback.notFound', { count: res.notFound }));
      }

      setFeedback({
        type: 'success',
        message: msgParts.join('. ') + '.',
      });

      setEditOpen(false);
      setEditRow(null);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message ?? t('woodBillingPage:messages.invoiceFailed') });
    }
  }, [selection, t]);


  /**
 * Build a print-friendly dataset and navigate to the report page.
 * - If some rows are selected, only those go to the report.
 * - If no selection, all current result rows are used.
 * - Data is stored in localStorage so the /reports/wood-billing page can read it.
 */
  const handleOpenReport = useCallback(() => {
    // If there is a selection, filter rows by selected ids; otherwise use all rows
    const selSet = new Set(selection as (string | number)[]);
    const used = (selection.length > 0)
      ? rows.filter(r => selSet.has(r.id))
      : rows;

    if (!used.length) {
      setFeedback({ type: 'error', message: t('woodBillingPage:messages.noRowsForReport') });
      return;
    }

    // Helper: convert ISO (YYYY-MM-DD) to the report’s DD.MM.YYYY format
    const toDDMMYYYY = (iso?: string | null) => {
      if (!iso) return '';
      const d = dayjs(iso, 'YYYY-MM-DD', true);
      return d.isValid() ? d.format('DD.MM.YYYY') : '';
    };

    // Map the grid rows to a slim report schema written to localStorage
    const payload = used.map(r => ({
      kuormaId: r.id,
      pvm: toDDMMYYYY(String(r.date ?? '')),
      ajomaaraysNro: String(r.waybillNumber ?? '') || null,
      vastaanottoNro: String(r.vastaanottoNro ?? '') || null,
      puulaaniNimi: String(r.puulaaniName ?? '') || null,
      timberType: String(r.woodType ?? '') || null,
      asiakkaanNimi: String(r.customer ?? '') || null,
      rekNro: String(r.vehicle ?? '') || null,
      reitti: String(r.route ?? '') || null,
      lisatiedot: String(r.notes ?? '') || null,
      m3: Number((r as any).quantityM3 ?? 0) || 0,
      km: Number((r as any).km ?? 0) || 0,
      tunnit: Number((r as any).hours ?? 0) || 0,
      kpl: Number((r as any).pieces ?? 0) || 0,
    }));

    // Persist for the report page and navigate there
    localStorage.setItem('woodBillingReportData', JSON.stringify(used));
    router.push(`/${params.lng}/puulaani-invoicing/report`);
  }, [rows, selection, t, router]);

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('woodBillingPage:title')}
      </Typography>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Filters view */}
      {showFilters && (
        <>
          <WoodBillingFilters onSubmit={handleFiltersSubmit} loading={loading} initialValues={lastQuery} />
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Results view */}
      {!showFilters && (
        <>
          {/* Action bar */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              mb: 1,
            }}
          >
            <Button variant="outlined" onClick={handleBackToFilters}>
              {t('common:buttons.back')}
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleInvoiceSelected}
                disabled={rows.length === 0}
              >
                {t('woodBillingPage:buttons.invoice')}
              </Button>
              <Button
                variant="contained"
                onClick={handleOpenReport}>
                {t('woodBillingPage:buttons.report')}
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 1 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <WoodBillingTable
                key={tableKey}
                rows={rows}
                onEdit={handleOpenEdit}
                onSelectionChange={setSelection}
              />
            )}
          </Box>
        </>
      )}

      {/* Edit dialog */}
      <EditInvoicingDialog
        open={editOpen}
        row={editRow}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        onDirtyChange={handleDialogDirty}
      />
    </Paper>
  );
}
