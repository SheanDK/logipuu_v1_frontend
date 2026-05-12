// src/app/[lng]/(main)/chip-invoicing/report/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import ChipInvoicingReport from '@/components/invoicing/ChipInvoicingReport';
import { useTranslation } from '@/i18n/useTranslation'; // ව්‍යාපෘතියේ සම්මත hook එක භාවිතා කිරීම

export default function ChipInvoicingReportPage() {
    const [data, setData] = useState<any[] | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const { t } = useTranslation(['chipInvoicing']); // chipInvoicing namespace එක ලබා ගැනීම

    useEffect(() => {
        try {
            const s = sessionStorage.getItem('chipInvoicingReportData');

            if (!s) {
                setErr(t('chipInvoicing:report.error')); // JSON: "Ei raporttidataa..."
                return;
            }

            const parsedData = JSON.parse(s);
            setData(parsedData);

        } catch (e) {
            setErr(t('chipInvoicing:report.parseError')); // JSON: "Raporttidatan jäsentäminen..."
        }
    }, [t]);

    if (err) return (
        <Box sx={{ p: 4 }}>
            <Alert severity="error">{err}</Alert>
        </Box>
    );

    if (!data) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
            <CircularProgress sx={{ color: '#a38f6d' }} />
        </Box>
    );

    return <ChipInvoicingReport rows={data} />;
}