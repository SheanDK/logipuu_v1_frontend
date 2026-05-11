// frontend/src/components/invoicing/ConsignmentInvoicingDialog.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, Button, Typography, Divider, Stack, Paper, alpha, useTheme
} from '@mui/material';
import type { BillingRow } from '@/services/invoicingService';
import { useTranslation } from '@/i18n/useTranslation';
import dayjs from 'dayjs';

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

type EditForm = {
  pvm: string;
  rahtikirjanNro: string;
  ajoreitti: string;
  lisatiedot: string;
  maaraM3: number;
  km: number;
  kpl: number;
  jakoTunnit: number;
  hintaM3: number;
  hintaKm: number;
  hintaKpl: number;
  hintaJakoTunti: number;
  tievero: number;
};

type Props = {
  open: boolean;
  row: BillingRow | null;
  onClose: () => void;
  onSave: (data: { rowId: BillingRow['id']; form: EditForm; total: number }) => void;
  onDirtyChange?: (args: { rowId: BillingRow['id']; dirty: boolean }) => void;
};

const ConsignmentInvoicingDialog: React.FC<Props> = ({ open, row, onClose, onSave, onDirtyChange }) => {

  const theme = useTheme();
  const { t } = useTranslation(['consignmentBillingDialog', 'common']);

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

  const [form, setForm] = useState<EditForm>(initial);
  useEffect(() => setForm(initial), [initial]);

  const isBilled = Boolean(row?.billed || (row as any)?.billedDate);

  const isDirty = useMemo(() => {
    const norm = (v: any) => (typeof v === 'number' ? Number(v) : String(v ?? '').trim());
    return (Object.keys(initial) as (keyof EditForm)[])
      .some(k => norm(form[k]) !== norm(initial[k]));
  }, [form, initial]);

  useEffect(() => {
    if (!row || !onDirtyChange) return;
    onDirtyChange({ rowId: row.id, dirty: !isBilled && isDirty });
  }, [row, isBilled, isDirty, onDirtyChange]);

  const total =
    form.maaraM3 * form.hintaM3 +
    form.km * form.hintaKm +
    form.kpl * form.hintaKpl +
    form.jakoTunnit * form.hintaJakoTunti +
    form.tievero;

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

  const handleSaveClick = () => {
    if (!row) return;
    onSave({ rowId: row.id, form, total });
  };

  // Helper for Metric Row
  const MetricRow = ({ label, qtyKey, priceKey, subtotal }: any) => (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography sx={{ width: 140, fontWeight: 500, fontSize: '0.9rem' }}>{label}</Typography>
      <TextField
        label="Qty"
        type="number"
        size="small"
        value={form[qtyKey as keyof EditForm]}
        onChange={handleChange(qtyKey as keyof EditForm)}
        disabled={isBilled}
        sx={{ width: 120 }}
      />
      <TextField
        label="Unit Price"
        type="number"
        size="small"
        value={form[priceKey as keyof EditForm]}
        onChange={handleChange(priceKey as keyof EditForm)}
        disabled={isBilled}
        sx={{ width: 120 }}
      />
      <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: 'text.primary' }}>
        {subtotal.toFixed(2)} €
      </Typography>
    </Stack>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: alpha('#a38f6d', 0.02), borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#a38f6d' }}>
            {t('consignmentBillingDialog:title') || 'Edit Consignment Invoice'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {form.pvm ? dayjs(form.pvm).format('DD.MM.YYYY') : ''}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header Info Section */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.02),
              border: '1px solid',
              borderColor: 'divider'
            }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Waybill Number"
                  size="small"
                  value={form.rahtikirjanNro}
                  onChange={handleChange('rahtikirjanNro')}
                  disabled={isBilled}
                  fullWidth
                />
                <TextField
                  label="Date"
                  type="date"
                  size="small"
                  value={form.pvm}
                  disabled
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Route"
                size="small"
                value={form.ajoreitti}
                onChange={handleChange('ajoreitti')}
                disabled={isBilled}
                fullWidth
              />
              <TextField
                label="Notes"
                size="small"
                multiline
                rows={2}
                value={form.lisatiedot}
                onChange={handleChange('lisatiedot')}
                disabled={isBilled}
                fullWidth
              />
            </Stack>
          </Paper>

          {/* Lines Section */}
          <Stack spacing={2}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ letterSpacing: 1 }}>
              LINES & METRICS
            </Typography>

            <Stack direction="row" spacing={2} sx={{ px: 1, opacity: 0.7 }}>
              <Typography variant="caption" sx={{ width: 140, fontWeight: 'bold' }}>METRIC</Typography>
              <Typography variant="caption" sx={{ width: 120, fontWeight: 'bold' }}>QUANTITY</Typography>
              <Typography variant="caption" sx={{ width: 120, fontWeight: 'bold' }}>UNIT PRICE</Typography>
              <Typography variant="caption" sx={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>SUBTOTAL</Typography>
            </Stack>

            <MetricRow label="Cubic Meters (m³)" qtyKey="maaraM3" priceKey="hintaM3" subtotal={form.maaraM3 * form.hintaM3} />
            <MetricRow label="Kilometers (km)" qtyKey="km" priceKey="hintaKm" subtotal={form.km * form.hintaKm} />
            <MetricRow label="Pieces (pcs)" qtyKey="kpl" priceKey="hintaKpl" subtotal={form.kpl * form.hintaKpl} />
            <MetricRow label="Distribution Hours" qtyKey="jakoTunnit" priceKey="hintaJakoTunti" subtotal={form.jakoTunnit * form.hintaJakoTunti} />

            <Divider />

            {/* Road Tax Row */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ width: 140, fontWeight: 500, fontSize: '0.9rem' }}>Road Tax / Toll</Typography>
              <Box sx={{ width: 120 }} />
              <TextField
                label="Tax Amount"
                type="number"
                size="small"
                value={form.tievero}
                onChange={handleChange('tievero')}
                disabled={isBilled}
                sx={{ width: 120 }}
              />
              <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                {form.tievero.toFixed(2)} €
              </Typography>
            </Stack>

            {/* Grand Total Section */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: alpha('#a38f6d', 0.05), border: '1px dashed #a38f6d' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">Grand Total</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#a38f6d' }}>
                  {total.toFixed(2)} €
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: alpha('#a38f6d', 0.02) }}>
        <Button variant="outlined" onClick={onClose} color="inherit">
          {t('common:buttons.close') || 'Close'}
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveClick}
          disabled={isBilled || !isDirty}
          sx={{ bgcolor: '#a38f6d', px: 4, '&:hover': { bgcolor: '#8e7a5a' } }}
        >
          {t('common:buttons.update') || 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConsignmentInvoicingDialog;