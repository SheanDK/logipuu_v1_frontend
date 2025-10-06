// app/[lng]/(main)/puulaani-invoicing/report/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import WoodBillingReport from '@/components/invoicing/WoodBillingReport';
import type { BillingRow } from '@/services/invoicingService';
import { useTranslation } from '@/i18n/useTranslation';

export default function WoodBillingReportPage() {
  const { t } = useTranslation(['woodBillingReport']);
  const [data, setData] = useState<BillingRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('woodBillingReportData');
      if (!s) { setErr(t('woodBillingReport:errors.noLocalStorage')); return; }
      setData(JSON.parse(s) as BillingRow[]);
    } catch {
      setErr(t('woodBillingReport:errors.parseFailed'));
    }
  }, [t]);

  if (err) return <Alert severity="error" sx={{ m: 2 }}>{err}</Alert>;
  if (!data) return <Box sx={{ display:'flex', justifyContent:'center', p:4 }}><CircularProgress/></Box>;

  return <WoodBillingReport rows={data} />;
}
