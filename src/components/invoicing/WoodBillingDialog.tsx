'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, TextField, Button, Typography, Divider
} from '@mui/material';
import type { BillingRow } from '@/services/invoicingService';
import { useTranslation } from '@/i18n/useTranslation';

// --- Helpers ---
const toISO = (d?: string | null): string => {
    if (!d) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (m) return d;
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return '';
    const y = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
};

type EditForm = {
    pvm: string;
    laskutusPvm: string;
    ajomaaraysNro: string;
    puulaani: string;
    vastaanottoNro: string;
    puutavaralaji: string;
    asiakas: string;
    autoNro: string;
    kuljettaja: string;
    ajoreitti: string;
    lisatiedot: string;

    // price lines
    maaraM3: number;
    hintaM3: number;
    rahtiKm: number;
    hintaKm: number;
    tunnit: number;
    hintaTunti: number;
    kpl: number;
    hintaKpl: number;
};

type Props = {
    open: boolean;
    row: BillingRow | null;
    onClose: () => void;
    onSave: (data: { rowId: BillingRow['id']; form: EditForm; total: number }) => void;
    onDirtyChange?: (args: { rowId: BillingRow['id']; dirty: boolean }) => void;
};

const EditInvoicingDialog: React.FC<Props> = ({ open, row, onClose, onSave, onDirtyChange }) => {
    const { t } = useTranslation(['woodBillingDialog', 'common']);
    
    // Build initial form state from the selected row
    const initial: EditForm = useMemo(() => ({
        pvm: toISO(row?.date ?? '') || '',
        laskutusPvm: toISO((row as any)?.billedDate ?? '') || '',
        ajomaaraysNro: row?.waybillNumber ?? '',
        puulaani: row?.puulaaniName ?? '',
        vastaanottoNro: row?.vastaanottoNro ?? '',
        puutavaralaji: row?.woodType ?? '',
        asiakas: row?.customer ?? '',
        autoNro: row?.vehicle ?? '',
        kuljettaja: row?.driverName ?? '',
        ajoreitti: row?.route ?? '',
        lisatiedot: row?.notes ?? '',

        maaraM3: Number(row?.quantityM3 ?? 0),
        hintaM3: Number(row?.unitPrice ?? 0),

        rahtiKm: Number((row as any)?.km ?? 0),
        hintaKm: Number((row as any)?.unitPriceKm ?? 0),

        tunnit: Number((row as any)?.hours ?? 0),
        hintaTunti: Number((row as any)?.unitPriceHour ?? 0),

        kpl: Number((row as any)?.pieces ?? 0),
        hintaKpl: Number((row as any)?.unitPricePiece ?? 0),

    }), [row?.id]);

    const [form, setForm] = useState<EditForm>(initial);
    useEffect(() => setForm(initial), [initial]);
    //console.log('[Dialog][INIT] form =', initial);

    // billed lock (row may have billed boolean or billedDate; also initial.laskutusPvm)
    const isBilled = Boolean(row?.billed || (row as any)?.billedDate || initial.laskutusPvm); // <-- ADD

    // dirty detection – any field different from initial -> "changed"
    const isDirty = React.useMemo(() => {                                            // <-- ADD
        const norm = (v: any) => (typeof v === 'number' ? Number(v) : String(v ?? '').trim());
        const keys = Object.keys(initial) as (keyof EditForm)[];
        return keys.some(k => norm(form[k]) !== norm(initial[k]));
    }, [form, initial]);

    //  inform parent page about dirty state (don’t mark dirty for billed rows)
    useEffect(() => {                                                                 // <-- ADD
        if (!row || !onDirtyChange) return;
        onDirtyChange({ rowId: row.id, dirty: !isBilled && isDirty });
    }, [row, isBilled, isDirty, onDirtyChange]);

    const total =
        form.maaraM3 * form.hintaM3 +
        form.rahtiKm * form.hintaKm +
        form.tunnit * form.hintaTunti +
        form.kpl * form.hintaKpl;

    useEffect(() => {
        if (open) {
            //console.log('[Dialog][FORM CHANGE] form =', form, 'computed total =', total);
        }
    }, [open, form, total]);

    // handleChange – block changes if billed
    const handleChange = (key: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isBilled) return; // lock editing for billed rows                 // <-- ADD
        const v = e.target.value;
        setForm((f) => ({
            ...f,
            [key]:
                (['maaraM3', 'hintaM3', 'rahtiKm', 'hintaKm', 'tunnit', 'hintaTunti', 'kpl', 'hintaKpl'] as (keyof EditForm)[])
                    .includes(key) ? Number(v) : v,
        }));
    };

    const handleSaveClick = () => {
        if (!row) return;
        onSave({ rowId: row.id, form, total });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t('woodBillingDialog:title')}</DialogTitle>
            <DialogContent dividers>

                {/* --- Header form (CSS grid, 2 columns on >= sm) --- */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        gap: 2,
                    }}
                >
                    <TextField
                        label={t('woodBillingDialog:fields.date')}
                        type="date"
                        disabled
                        value={form.pvm}
                        onChange={handleChange('pvm')}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                    <TextField
                        label={t('woodBillingDialog:fields.billingDate')}
                        disabled
                        type="date"
                        value={form.laskutusPvm}
                        onChange={handleChange('laskutusPvm')}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />

                    <TextField label={t('woodBillingDialog:fields.waybillNumber')} value={form.ajomaaraysNro} onChange={handleChange('ajomaaraysNro')} fullWidth disabled={isBilled} />
                    <TextField label={t('woodBillingDialog:fields.timberStack')} value={form.puulaani} disabled fullWidth />

                    <TextField label={t('woodBillingDialog:fields.receiptNumber')} value={form.vastaanottoNro} onChange={handleChange('vastaanottoNro')} fullWidth disabled={isBilled} />
                    <TextField label={t('woodBillingDialog:fields.woodType')} value={form.puutavaralaji} disabled fullWidth  />

                    <TextField label={t('woodBillingDialog:fields.customer')} value={form.asiakas} disabled fullWidth />
                    <TextField label={t('woodBillingDialog:fields.vehicle')} value={form.autoNro} disabled fullWidth />

                    <TextField label={t('woodBillingDialog:fields.driver')} value={form.kuljettaja} disabled fullWidth />
                    <TextField label={t('woodBillingDialog:fields.route')} value={form.ajoreitti} onChange={handleChange('ajoreitti')} fullWidth disabled={isBilled}/>

                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <TextField
                            label={t('woodBillingDialog:fields.notes')}
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

                {/* --- Price lines --- */}
                <Typography variant="h6" sx={{ mb: 1 }}> {t('woodBillingDialog:lines.title')}</Typography>

                {/* Column headers (visible on sm+; hidden on mobile where rows stack) */}

                <Box
                    sx={{
                        display: { xs: 'none', sm: 'grid' },
                        gridTemplateColumns: '1fr 1fr 1fr',   // 1: label | 2: amount | 3: unit price
                        alignItems: 'end',
                        mb: 0.75,
                    }}
                >
                    <Box
                        sx={{
                            gridColumn: '2 / -1',               // span columns 2–3
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',     // amount | unit price
                            gap: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            pb: 0.5,
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                           {t('woodBillingDialog:lines.amount')}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                            {t('woodBillingDialog:lines.unitPrice')}
                        </Typography>
                    </Box>
                </Box>

                {/* Each row: label + two inputs; 3 columns on >= sm */}
                <Box sx={{ display: 'grid', gap: 1.5 }}>

                    {/* Cubic Meters */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        <Typography>{t('woodBillingDialog:lines.cubicMeters')}</Typography>
                        <TextField
                            type="number"
                            value={form.maaraM3}
                            inputProps={{ step: '0.01' }}
                            onChange={handleChange('maaraM3')}
                            fullWidth
                            disabled={isBilled}
                        />
                        <TextField
                            type="number"
                            value={form.hintaM3}
                            inputProps={{ step: '0.01' }}
                            onChange={handleChange('hintaM3')}
                            fullWidth
                            disabled={isBilled}
                        />
                    </Box>

                    {/* Km */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        <Typography>{t('woodBillingDialog:lines.freightKm')}</Typography>
                        <TextField
                            type="number"
                            value={form.rahtiKm}
                            inputProps={{ step: '0.01' }}
                            onChange={handleChange('rahtiKm')}
                            fullWidth
                            disabled={isBilled}
                        />
                        <TextField
                            type="number"
                            value={form.hintaKm}
                            inputProps={{ step: '0.01' }}
                            onChange={handleChange('hintaKm')}
                            fullWidth
                            disabled={isBilled}
                        />
                    </Box>

                    {/* Hours */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        <Typography>{t('woodBillingDialog:lines.hours')}</Typography>
                        <TextField
                            type="number"
                            value={form.tunnit}
                            inputProps={{ step: '0.01' }}
                            onChange={handleChange('tunnit')}
                            fullWidth
                            disabled={isBilled}
                        />
                        <TextField
                            type="number"
                            value={form.hintaTunti}
                            inputProps={{ step: '0.01' }}
                            onChange={handleChange('hintaTunti')}
                            fullWidth
                            disabled={isBilled}
                        />
                    </Box>

                    {/* Pieces */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        <Typography>{t('woodBillingDialog:lines.pieces')}</Typography>
                        <TextField
                            type="number"
                            value={form.kpl}
                            inputProps={{ step: '0.01' }}
                            onChange={handleChange('kpl')}
                            fullWidth
                            disabled={isBilled}
                        />
                        <TextField
                            type="number"
                            value={form.hintaKpl}
                            inputProps={{ step: '0.01' }}
                            onChange={handleChange('hintaKpl')}
                            fullWidth
                            disabled={isBilled}
                        />
                    </Box>

                    {/* Total */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' },
                            gap: 1,
                            alignItems: 'center',
                            mt: 1,
                        }}
                    >
                        <Typography fontWeight={600}>{t('woodBillingDialog:lines.total')}</Typography>
                        <TextField value={total.toFixed(2)} InputProps={{ readOnly: true }} fullWidth />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button variant="outlined" onClick={onClose}>{t('common:buttons.close')}</Button>
                <Button variant="contained" onClick={handleSaveClick} disabled={isBilled || !isDirty}> {t('common:buttons.update')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditInvoicingDialog;
