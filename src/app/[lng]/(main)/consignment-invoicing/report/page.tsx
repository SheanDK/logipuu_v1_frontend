'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import ConsigmentBillingReport from '@/components/invoicing/ConsignmentBillingReport';
import type { BillingRow } from '@/services/invoicingService';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * ConsigmentBillingReportPage
 * - Reads the report dataset from localStorage (written by the main list page)
 * - Shows a spinner while loading, an error alert on failure,
 *   and the printable report component on success.
 */
export default function ConsigmentBillingReportPage() {
  const { t } = useTranslation(['consigmentBillingReport']);
  const [data, setData] = useState<BillingRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  /**
   * Attempt to load and parse the report payload from localStorage.
   * If the key is missing or JSON parsing fails, surface a localized error.
   */
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

  // Error state
  if (err) return <Alert severity="error" sx={{ m: 2 }}>{err}</Alert>;

  // Loading state
  if (!data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );

  // Success: render the printable report
  return <ConsigmentBillingReport rows={data} />;
}
