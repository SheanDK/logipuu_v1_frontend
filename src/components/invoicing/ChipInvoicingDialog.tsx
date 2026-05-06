// frontend/src/components/invoicing/ChipInvoicingDialog.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, TextField, Button, Typography, Stack, Divider, Paper
} from '@mui/material';
import dayjs from 'dayjs';

const ChipInvoicingDialog = ({ open, row, onClose, onSave }: any) => {
    const [form, setForm] = useState({
        actualM3: 0, priceM3: 0,
        actualTon: 0, priceTon: 0,
        actualPcs: 0, pricePcs: 0,
        actualHr: 0, priceHr: 0,
        actualKm: 0, priceKm: 0
    });

    useEffect(() => {
        if (row && open) {
            console.log("Loading Row Data into Dialog:", row);
            setForm({
                actualM3: Number(row.actualM3 || 0),
                priceM3: Number(row.unitPriceM3 || 0),
                actualTon: Number(row.actualTon || 0),
                priceTon: Number(row.unitPriceTon || 0),
                actualPcs: Number(row.actualPcs || 0),
                pricePcs: Number(row.unitPricePcs || 0),
                actualHr: Number(row.actualHr || 0),
                priceHr: Number(row.unitPriceHr || 0),
                actualKm: Number(row.actualKm || 0),
                priceKm: Number(row.unitPriceKm || 0)
            });
        }
    }, [row, open]);

    const calculations = useMemo(() => {
        const m3Total = form.actualM3 * form.priceM3;
        const tonTotal = form.actualTon * form.priceTon;
        const pcsTotal = form.actualPcs * form.pricePcs;
        const hrTotal = form.actualHr * form.priceHr;
        const kmTotal = form.actualKm * form.priceKm;
        const grandTotal = m3Total + tonTotal + pcsTotal + hrTotal + kmTotal;

        return { m3Total, tonTotal, pcsTotal, hrTotal, kmTotal, grandTotal };
    }, [form]);

    const handleSave = () => {
        onSave(row.loadId, { ...form, total: calculations.grandTotal });
    };

    const MetricRow = ({ label, qtyKey, priceKey, subtotal }: any) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ width: 120, fontWeight: 500 }}>{label}</Typography>
            <TextField
                label="Qty"
                type="number"
                size="small"
                value={form[qtyKey as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [qtyKey]: Number(e.target.value) })}
                sx={{ width: 120 }}
            />
            <TextField
                label="Unit Price"
                type="number"
                size="small"
                value={form[priceKey as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [priceKey]: Number(e.target.value) })}
                sx={{ width: 120 }}
            />
            <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                {subtotal.toFixed(2)} €
            </Typography>
        </Stack>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ bgcolor: '#fbfbfb', borderBottom: '1px solid #eee' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#a38f6d' }}>
                        Edit Transport Load #{row?.loadId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {dayjs(row?.date).format('DD.MM.YYYY')}
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* Basic Info Header */}
                    <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                        <Stack direction="row" spacing={4}>
                            <Typography variant="body2">Customer: <strong>{row?.customer}</strong></Typography>
                            <Typography variant="body2">Vehicle: <strong>{row?.vehicle}</strong></Typography>
                            <Typography variant="body2">Item: <strong>{row?.titleName}</strong></Typography>
                        </Stack>
                    </Box>

                    {/* Table-like headers */}
                    <Stack direction="row" spacing={2} sx={{ px: 1 }}>
                        <Typography variant="caption" sx={{ width: 120, fontWeight: 'bold' }}>METRIC</Typography>
                        <Typography variant="caption" sx={{ width: 120, fontWeight: 'bold' }}>QUANTITY</Typography>
                        <Typography variant="caption" sx={{ width: 120, fontWeight: 'bold' }}>UNIT PRICE</Typography>
                        <Typography variant="caption" sx={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>SUBTOTAL</Typography>
                    </Stack>

                    {/* Input Rows */}
                    <MetricRow label="Cubic Meters (m³)" qtyKey="actualM3" priceKey="priceM3" subtotal={calculations.m3Total} />
                    <MetricRow label="Weight (Tons)" qtyKey="actualTon" priceKey="priceTon" subtotal={calculations.tonTotal} />
                    <MetricRow label="Pieces (Pcs)" qtyKey="actualPcs" priceKey="pricePcs" subtotal={calculations.pcsTotal} />
                    <MetricRow label="Work Hours" qtyKey="actualHr" priceKey="priceHr" subtotal={calculations.hrTotal} />
                    <MetricRow label="Kilometers (km)" qtyKey="actualKm" priceKey="priceKm" subtotal={calculations.kmTotal} />

                    <Divider />

                    {/* Summary Section */}
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#a38f6d0a', border: '1px dashed #a38f6d' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" fontWeight="bold">Grand Total</Typography>
                            <Typography variant="h5" fontWeight="bold" color="primary" sx={{ color: '#a38f6d' }}>
                                {calculations.grandTotal.toFixed(2)} €
                            </Typography>
                        </Stack>
                    </Paper>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#fbfbfb', borderTop: '1px solid #eee' }}>
                <Button onClick={onClose} variant="outlined" color="inherit">Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{ bgcolor: '#a38f6d', px: 4, '&:hover': { bgcolor: '#8e7a5a' } }}
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChipInvoicingDialog;