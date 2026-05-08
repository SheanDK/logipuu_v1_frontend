// src/app/[lng]/(main)/chip-invoicing/report/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import ChipInvoicingReport from '@/components/invoicing/ChipInvoicingReport';
import { useTranslation } from '@/i18n/useTranslation';

export default function ChipInvoicingReportPage() {
    const { t } = useTranslation(['chipInvoicingReport']);
    const [data, setData] = useState<any[] | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        try {
            const s = localStorage.getItem('chipInvoicingReportData');
            if (!s) {
                setErr("No report data found. Please select loads first.");
                return;
            }
            setData(JSON.parse(s));
        } catch {
            setErr("Failed to parse report data.");
        }
    }, []);

    if (err) return <Alert severity="error" sx={{ m: 2 }}>{err}</Alert>;

    if (!data) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
            <CircularProgress sx={{ color: '#a38f6d' }} />
        </Box>
    );

    return <ChipInvoicingReport rows={data} />;
}