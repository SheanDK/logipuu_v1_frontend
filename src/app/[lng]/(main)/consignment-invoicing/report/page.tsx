//src/app/(lng)/(main)/consignment-invoicing/report/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import ConsigmentBillingReport from '@/components/invoicing/ConsignmentBillingReport';
import type { BillingRow } from '@/services/invoicingService';
import { useTranslation } from '@/i18n/useTranslation';


export default function ConsigmentBillingReportPage() {
  const { t } = useTranslation(['consigmentBillingReport']);
  const [data, setData] = useState<BillingRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('consigmentBillingReportData');
      if (!s) {
        setErr(t('consigmentBillingReport:errors.noLocalStorage'));
        return;
      }
      setData(JSON.parse(s) as BillingRow[]);
    } catch {
      setErr(t('consigmentBillingReport:errors.parseFailed'));
    }
  }, [t]);


  if (err) return <Alert severity="error" sx={{ m: 2 }}>{err}</Alert>;


  if (!data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );


  return <ConsigmentBillingReport rows={data} />;
}
