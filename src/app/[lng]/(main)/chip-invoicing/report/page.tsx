// src/app/[lng]/(main)/chip-invoicing/report/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import ChipInvoicingReport from '@/components/invoicing/ChipInvoicingReport';

export default function ChipInvoicingReportPage() {
    const [data, setData] = useState<any[] | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        try {
            const s = sessionStorage.getItem('chipInvoicingReportData');

            if (!s) {
                setErr("No report data found. Please close this window and try again.");
                return;
            }

            const parsedData = JSON.parse(s);
            setData(parsedData);

        } catch (e) {
            setErr("Failed to parse report data.");
        }
    }, []);

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