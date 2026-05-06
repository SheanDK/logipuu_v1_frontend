// src/app/[lng]/(main)/consignment-invoicing/page.tsx
'use client';
import React, { useCallback, useState, useEffect } from 'react';
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
import axios from 'axios';

type BillingRowWithState = BillingRow & { changed?: boolean };

// Define an interface for the form data used in handleSaveEdit
export interface EditForm {
  pvm: string | null;
  rahtikirjanNro: string | null;
  ajoreitti: string | null;
  lisatiedot: string | null;
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

  // FIX: Initialize lastQuery properly
  const [lastQuery, setLastQuery] = useState<ConsigmentSearchParams | null>(null);
  const [reloading, setReloading] = useState(false);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('consignment_filters');
      if (saved && !lastQuery) {
        try {
          const parsed = JSON.parse(saved);
          setLastQuery(parsed);
          handleFiltersSubmit(parsed);
        } catch (e) {
          console.error("Failed to parse saved filters", e);
        }
      }
    }
  }, [lastQuery]);


  useEffect(() => {
    if (lastQuery) {
      sessionStorage.setItem('consignment_filters', JSON.stringify(lastQuery));
    }
  }, [lastQuery]);

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


  const handleBackToFilters = useCallback(() => {
    setShowFilters(true);
    setEditOpen(false);
    setEditRow(null);
    setDialogDirty(false);
    setDiscardConfirmOpen(false);
    setSelection([]);
  }, []);
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
        copy[idx] = { ...current, changed: false };
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


  const handleDialogDirty = useCallback((
    { rowId, dirty }: { rowId: BillingRow['id']; dirty: boolean }
  ) => {
    setDialogDirty(dirty);
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      if (idx === -1) return prev;
      const current = prev[idx];
      if (current.changed === dirty) return prev;
      const copy = [...prev];
      copy[idx] = { ...current, changed: dirty };
      return copy;
    });
  }, []);

  const handleSaveEdit = useCallback(async ({ rowId, form, total }: { rowId: BillingRow['id'], form: EditForm, total: number }) => {
    try {
      const isTemp = typeof rowId === 'string' && rowId.startsWith('temp-');

      const dto: UpsertConsignmentDto = {
        date: form.pvm || '',
        waybillNumber: form.rahtikirjanNro || '',
        route: form.ajoreitti || '',
        notes: form.lisatiedot || '',

        quantityM3: Number(form.maaraM3) || 0,
        unitPriceM3: Number(form.hintaM3) || 0,
        km: Number(form.km) || 0,
        unitPriceKm: Number(form.hintaKm) || 0,
        pieces: Number(form.kpl) || 0,
        unitPricePiece: Number(form.hintaKpl) || 0,
        hours: Number(form.jakoTunnit) || 0,
        unitPriceHour: Number(form.hintaJakoTunti) || 0,

        roadTax: Number(form.tievero) || 0,
        total: Number(total) || 0
      };

      if (isTemp) {
        const src = rows.find((r) => r.id === rowId) ?? editRow;
        const kuormaId = num((src as BillingRow & { kuormaId?: number })?.kuormaId, NaN);

        if (!Number.isFinite(kuormaId)) {
          throw new Error('kuormaId not found for new row.');
        }

        const created = await createConsignment({ ...dto, kuormaId });
        setRows((prev) => prev.map(r => r.id === rowId ? { ...created, changed: false } as BillingRow : r));
      } else {
        const idForUpdate = Number(rowId);

        if (!Number.isFinite(idForUpdate)) {
          throw new Error('Invalid ID format for update.');
        }

        const updated = await updateConsignment(idForUpdate, dto);
        setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...updated, changed: false } as BillingRow : r)));
      }

      finalizeCloseEdit();
      setFeedback({ type: 'success', message: t('messages.saveOk') });

    } catch (err: unknown) {
      const message = axios.isAxiosError(err) && err.response
        ? (err.response.data as { message: string }).message
        : (err instanceof Error ? err.message : t('messages.updateFailed'));

      setFeedback({ type: 'error', message: message || t('messages.updateFailed') });
    }
  }, [rows, editRow, t, finalizeCloseEdit]);

  const handleInvoiceSelected = useCallback(
    async () => {
      const selSet = new Set(selection as (string | number)[]);
      const used = selection.length > 0 ? rows.filter((r) => selSet.has(r.id)) : rows;

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

        const parts: string[] = [];
        if (res.updated) parts.push(t('consigmentBillingPage:feedback.invoiced', { count: res.updated }));
        if (res.alreadyBilled) parts.push(t('consigmentBillingPage:feedback.already', { count: res.alreadyBilled }));
        if (res.notFound) parts.push(t('consigmentBillingPage:feedback.notFound', { count: res.notFound }));
        setFeedback({ type: 'success', message: parts.join('. ') || t('common:messages.ok') });

        setSelection([]);
      } catch (e: unknown) {
        const message = axios.isAxiosError(e) && e.response ? (e.response.data as { message: string }).message : (e instanceof Error ? e.message : String(e));
        setFeedback({ type: 'error', message: message || t('messages.invoiceFailed') });
      } finally {
        setReloading(false);
      }
    }, [selection, rows, t]);

  const handleOpenReport = useCallback(() => {
    const selSet = new Set(selection as (string | number)[]);
    const used = selection.length > 0 ? rows.filter((r) => selSet.has(r.id)) : rows;

    if (!used.length) {
      setFeedback({ type: 'error', message: t('consigmentBillingPage:messages.noRowsForReport') });
      return;
    }
    localStorage.setItem('consigmentBillingReportData', JSON.stringify(used));
    const url = `/${params.lng}/consignment-invoicing/report`;
    window.open(url, '_blank');

  }, [rows, selection, t, params.lng]);

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

  const runDelete = useCallback(
    async () => {
      setIsConfirming(true);
      try {
        const numericIds = confirmIds.filter((id) => !String(id).startsWith('temp-')) as number[];
        const tempIds = new Set(confirmIds.filter((id) => String(id).startsWith('temp-')).map(String));

        const res: { deletedIds: (number | string)[]; billedIds: (number | string)[]; notFoundIds: (number | string)[] } = await deleteManyConsignments(numericIds);

        const deletedSet = new Set<number | string>([...res.deletedIds, ...Array.from(tempIds)]);
        const next = rows.filter((r) => !deletedSet.has(r.id));
        setRows(next);

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

      } catch (e: unknown) {
        let errorMessage = t('common:messages.error');
        if (axios.isAxiosError(e) && e.response) {
          errorMessage = (e.response.data as { message: string }).message || errorMessage;
        } else if (e instanceof Error) {
          errorMessage = e.message;
        }
        setFeedback({ type: 'error', message: errorMessage });
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
    [confirmIds, rows, t, refetch]
  );

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('consigmentBillingPage:title')}
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

      <ConsignmentInvoicingDialog
        open={editOpen}
        row={editRow}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        onDirtyChange={handleDialogDirty}
      />

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

      <Backdrop open={reloading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Paper>
  );
}