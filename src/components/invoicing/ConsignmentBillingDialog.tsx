'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, Button, Typography, Divider
} from '@mui/material';
import type { BillingRow } from '@/services/invoicingService';
import { useTranslation } from '@/i18n/useTranslation';

/* -----------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------*/

/**
 * Convert a date-like input to ISO (YYYY-MM-DD). Returns empty string on failure.
 * Accepts an already-ISO string and passes it through unchanged.
 */
const toISO = (d?: string | null): string => {
  if (!d) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (m) return d;
  const parsed = new Date(d as string);
  if (Number.isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
};

/* -----------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------------*/

/**
 * Dialog edit form state (kept separate from the raw BillingRow).
 * Uses Finnish field names for backwards-compat, but all comments below are in English.
 */
type EditForm = {
  // header
  pvm: string;                // date
  rahtikirjanNro: string;     // waybill number
  ajoreitti: string;          // route
  lisatiedot: string;         // notes

  // quantities
  maaraM3: number;            // cubic meters
  km: number;                 // kilometers
  kpl: number;                // pieces
  jakoTunnit: number;         // distribution hours

  // unit prices
  hintaM3: number;
  hintaKm: number;
  hintaKpl: number;
  hintaJakoTunti: number;

  // extras
  tievero: number;            // road/toll tax
};

type Props = {
  open: boolean;
  row: BillingRow | null;
  onClose: () => void;
  onSave: (data: { rowId: BillingRow['id']; form: EditForm; total: number }) => void;
  onDirtyChange?: (args: { rowId: BillingRow['id']; dirty: boolean }) => void;
};

/**
 * Consignment invoice line editor dialog.
 * - Initializes form state from the provided BillingRow
 * - Locks fields if the row is already billed
 * - Emits dirty-state changes upward
 * - Computes a live total from quantities, unit prices, and road tax
 */
const ConsignmentInvoicingDialog: React.FC<Props> = ({ open, row, onClose, onSave, onDirtyChange }) => {
  const { t } = useTranslation(['consignmentBillingDialog', 'common']);

  /** Initialize form from the current row (memoized by row.id). */
  const initial: EditForm = useMemo(() => ({
    pvm: toISO(row?.date ?? '') || '',
    rahtikirjanNro: row?.waybillNumber ?? '',
    ajoreitti: row?.route ?? '',
    lisatiedot: row?.notes ?? '',

    maaraM3: Number((row as any)?.quantityM3 ?? 0),
    km: Number((row as any)?.km ?? 0),
    kpl: Number((row as any)?.pieces ?? 0),
    jakoTunnit: Number((row as any)?.distributionHours ?? (row as any)?.hours ?? 0),

    hintaM3: Number((row as any)?.unitPriceM3 ?? row?.unitPrice ?? 0),
    hintaKm: Number((row as any)?.unitPriceKm ?? 0),
    hintaKpl: Number((row as any)?.unitPricePiece ?? 0),
    hintaJakoTunti: Number((row as any)?.unitPriceHour ?? (row as any)?.unitPriceDistributionHour ?? 0),

    tievero: Number((row as any)?.roadTax ?? (row as any)?.tievero ?? 0),
  }), [row?.id]);

  /** Local form state; reset whenever `initial` changes. */
  const [form, setForm] = useState<EditForm>(initial);
  useEffect(() => setForm(initial), [initial]);

  /** Lock the dialog inputs if the row has been billed. */
  const isBilled = Boolean(row?.billed || (row as any)?.billedDate);

  /** Compare current form against initial values to determine dirty-state. */
  const isDirty = useMemo(() => {
    const norm = (v: any) => (typeof v === 'number' ? Number(v) : String(v ?? '').trim());
    return (Object.keys(initial) as (keyof EditForm)[])
      .some(k => norm(form[k]) !== norm(initial[k]));
  }, [form, initial]);

  /** Notify parent about dirty-state changes (disabled if billed). */
  useEffect(() => {
    if (!row || !onDirtyChange) return;
    onDirtyChange({ rowId: row.id, dirty: !isBilled && isDirty });
  }, [row, isBilled, isDirty, onDirtyChange]);

  /** Total = (sum of line item quantities × unit prices) + road/toll tax. */
  const total =
    form.maaraM3 * form.hintaM3 +
    form.km * form.hintaKm +
    form.kpl * form.hintaKpl +
    form.jakoTunnit * form.hintaJakoTunti +
    form.tievero;

  /** Update handler for any form field (auto-casts numeric fields). */
  const handleChange = (key: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isBilled) return;
    const v = e.target.value;
    const numericKeys: (keyof EditForm)[] = [
      'maaraM3', 'km', 'kpl', 'jakoTunnit',
      'hintaM3', 'hintaKm', 'hintaKpl', 'hintaJakoTunti',
      'tievero',
    ];
    setForm(f => ({ ...f, [key]: numericKeys.includes(key) ? Number(v) : v }));
  };

  /** Compose payload and notify parent on save. */
  const handleSaveClick = () => {
    if (!row) return;
    onSave({ rowId: row.id, form, total });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{t('consignmentBillingDialog:title') || 'Edit consignment invoice'}</DialogTitle>
      <DialogContent dividers>

        {/* Header section */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 2,
        }}>
          <TextField
            label={t('consignmentBillingDialog:fields.date') || 'Date'}
            type="date"
            value={form.pvm}
            onChange={handleChange('pvm')}
            InputLabelProps={{ shrink: true }}
            fullWidth
            disabled
          />
          <TextField
            label={t('consignmentBillingDialog:fields.waybillNumber') || 'Waybill number'}
            value={form.rahtikirjanNro}
            onChange={handleChange('rahtikirjanNro')}
            fullWidth
            disabled={isBilled}
          />
          <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
            <TextField
              label={t('consignmentBillingDialog:fields.route') || 'Route'}
              value={form.ajoreitti}
              onChange={handleChange('ajoreitti')}
              fullWidth
              disabled={isBilled}
            />
          </Box>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              label={t('consignmentBillingDialog:fields.notes') || 'Notes'}
              value={form.lisatiedot}
              onChange={handleChange('lisatiedot')}
              fullWidth
              multiline
              minRows={2}
              disabled={isBilled}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Column headers (sm+) */}
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('consignmentBillingDialog:lines.title') || 'Lines'}
        </Typography>

        <Box sx={{
          display: { xs: 'none', sm: 'grid' },
          gridTemplateColumns: '1fr 1fr 1fr',
          alignItems: 'end',
          mb: 0.75,
        }}>
          <Box sx={{
            gridColumn: '2 / -1',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 0.5,
          }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              {t('consignmentBillingDialog:lines.amount') || 'Amount'}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              {t('consignmentBillingDialog:lines.unitPrice') || 'Unit price'}
            </Typography>
          </Box>
        </Box>

        {/* Lines */}
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {/* m³ */}
          <Row3
            label={t('consignmentBillingDialog:lines.cubicMeters') || 'm³'}
            amount={form.maaraM3}
            unitPrice={form.hintaM3}
            onAmountChange={handleChange('maaraM3')}
            onUnitPriceChange={handleChange('hintaM3')}
            disabled={isBilled}
          />
          {/* Km */}
          <Row3
            label={t('consignmentBillingDialog:lines.km') || 'Km'}
            amount={form.km}
            unitPrice={form.hintaKm}
            onAmountChange={handleChange('km')}
            onUnitPriceChange={handleChange('hintaKm')}
            disabled={isBilled}
          />
          {/* Pieces */}
          <Row3
            label={t('consignmentBillingDialog:lines.pieces') || 'Pieces'}
            amount={form.kpl}
            unitPrice={form.hintaKpl}
            onAmountChange={handleChange('kpl')}
            onUnitPriceChange={handleChange('hintaKpl')}
            disabled={isBilled}
          />
          {/* Distribution hours */}
          <Row3
            label={t('consignmentBillingDialog:lines.distributionHours') || 'Distribution hours'}
            amount={form.jakoTunnit}
            unitPrice={form.hintaJakoTunti}
            onAmountChange={handleChange('jakoTunnit')}
            onUnitPriceChange={handleChange('hintaJakoTunti')}
            disabled={isBilled}
          />

          {/* Road tax */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' },
            gap: 1,
            alignItems: 'center',
          }}>
            <Typography>{t('consignmentBillingDialog:lines.roadTax') || 'Road tax'}</Typography>
            <TextField
              type="number"
              value={form.tievero}
              inputProps={{ step: '0.01' }}
              onChange={handleChange('tievero')}
              fullWidth
              disabled={isBilled}
            />
          </Box>

          {/* Total */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' },
            gap: 1,
            alignItems: 'center',
            mt: 1,
          }}>
            <Typography fontWeight={600}>
              {t('consignmentBillingDialog:lines.total') || 'Total'}
            </Typography>
            <TextField value={total.toFixed(2)} InputProps={{ readOnly: true }} fullWidth />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          {t('common:buttons.close') || 'Close'}
        </Button>
        <Button variant="contained" onClick={handleSaveClick} disabled={isBilled || !isDirty}>
          {t('common:buttons.update') || 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConsignmentInvoicingDialog;

/* -----------------------------------------------------------------------------
 * Small helper row: three-field block (Label | Amount | Unit price)
 * ---------------------------------------------------------------------------*/
const Row3: React.FC<{
  label: string;
  amount: number;
  unitPrice: number;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUnitPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}> = ({ label, amount, unitPrice, onAmountChange, onUnitPriceChange, disabled }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
      gap: 1,
      alignItems: 'center',
    }}
  >
    <Typography>{label}</Typography>
    <TextField
      type="number"
      value={amount}
      inputProps={{ step: '0.01' }}
      onChange={onAmountChange}
      fullWidth
      disabled={disabled}
    />
    <TextField
      type="number"
      value={unitPrice}
      inputProps={{ step: '0.01' }}
      onChange={onUnitPriceChange}
      fullWidth
      disabled={disabled}
    />
  </Box>
);
