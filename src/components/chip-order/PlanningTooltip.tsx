// frontend/src/components/chip-order/PlanningTooltip.tsx
'use client';

import React from 'react';
import { Box, Typography, Stack, Paper, alpha } from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';

// 🚀 Helper function to prevent NaN errors
const safeNum = (val: any): string => {
    if (val === null || val === undefined || val === '') return '0';
    const num = Number(val);
    return isNaN(num) ? '0' : num.toString();
};

// Info row component
const InfoRow = ({ label, requested, actual }: { label: string, requested: any, actual: any }) => (
    <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', py: 0.5 }}>
        <Typography variant="caption" sx={{ flex: 1, fontWeight: 'bold', color: '#666' }}>{label}</Typography>
        <Typography variant="caption" sx={{ width: 60, textAlign: 'center' }}>{requested || '-'}</Typography>
        {/* 🚀 FIX: actual අගය safeNum හරහා ලබා දීම */}
        <Typography variant="caption" sx={{ width: 60, textAlign: 'center', fontWeight: 'bold', color: '#a38f6d' }}>
            {safeNum(actual)}
        </Typography>
    </Box>
);

// Planning tooltip component
const PlanningTooltip = ({ load, vehicle }: { load: any, vehicle: string }) => {
    const { t } = useTranslation(['chip-management']);

    // Naming convention checks (Support both Backend & Frontend formats)
    const reqTon = load.reqTon || load.req_ton;
    const reqM3 = load.reqM3 || load.req_m3;
    const reqPcs = load.reqPcs || load.req_pcs;

    return (
        <Paper elevation={8} sx={{
            minWidth: 280,
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #a38f6d',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
            {/* Header: Theme Color */}
            <Box sx={{ bgcolor: '#a38f6d', p: 1.5, color: 'white' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2, textTransform: 'uppercase' }}>
                    {load.titleName || load.title_name || 'CHIP TRANSPORT'}
                </Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Auto: <b>{vehicle}</b></Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        ID: <b>{load.loadId || load.load_id || '-'}</b>
                    </Typography>
                </Stack>
            </Box>

            {/* Body: Comparison Table */}
            <Box sx={{ p: 1.5, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', mb: 0.5, opacity: 0.6 }}>
                    <Typography variant="caption" sx={{ flex: 1 }}></Typography>
                    <Typography variant="caption" sx={{ width: 60, textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>REQ</Typography>
                    <Typography variant="caption" sx={{ width: 60, textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>ACTUAL</Typography>
                </Box>

                <Stack spacing={0}>
                    <InfoRow label="Tons (TN)" requested={reqTon ? 'YES' : '-'} actual={load.actualTon ?? load.actual_ton} />
                    <InfoRow label="Cubes (M3)" requested={reqM3 ? 'YES' : '-'} actual={load.actualM3 ?? load.actual_m3} />
                    <InfoRow label="Pieces (KPL)" requested={reqPcs ? 'YES' : '-'} actual={load.actualPcs ?? load.actual_pcs} />
                </Stack>

                <Box sx={{ mt: 1.5, p: 1, bgcolor: alpha('#a38f6d', 0.05), borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: '#a38f6d', fontWeight: 'bold', display: 'block', fontSize: '10px' }}>INSTRUCTIONS:</Typography>
                    <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mt: 0.2, color: '#555' }}>
                        {load.actualDetails || load.actual_details || load.driverNotes || 'No specific notes.'}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default PlanningTooltip;