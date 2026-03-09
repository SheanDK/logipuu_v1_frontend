//frontend\src\components\chip-order\PlanningTooltip.tsx
'use client';

import React from 'react';
import { Box, Typography, Stack, Paper } from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';

// Info row component
const InfoRow = ({ label, requested, actual }: { label: string, requested: any, actual: any }) => (
    <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', py: 0.5 }}>
        <Typography variant="caption" sx={{ flex: 1, fontWeight: 'bold', color: '#666' }}>{label}</Typography>
        <Typography variant="caption" sx={{ width: 60, textAlign: 'center' }}>{requested || '-'}</Typography>
        <Typography variant="caption" sx={{ width: 60, textAlign: 'center', fontWeight: 'bold', color: '#a38f6d' }}>{actual || '-'}</Typography>
    </Box>
);

// Planning tooltip component
const PlanningTooltip = ({ load, vehicle }: { load: any, vehicle: string }) => {
    const { t } = useTranslation(['chip-management']);

    return (
        <Paper elevation={8} sx={{
            minWidth: 280,
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #a38f6d'
        }}>
            {/* Header: Theme Color */}
            <Box sx={{ bgcolor: '#a38f6d', p: 1.5, color: 'white' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {load.titleName || 'CHIP TRANSPORT'}
                </Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Auto: <b>{vehicle}</b></Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Load ID: <b>{load.loadId}</b></Typography>
                </Stack>
            </Box>

            {/* Body: Comparison Table */}
            <Box sx={{ p: 1.5, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', mb: 0.5, opacity: 0.7 }}>
                    <Typography variant="caption" sx={{ flex: 1 }}></Typography>
                    <Typography variant="caption" sx={{ width: 60, textAlign: 'center', fontWeight: 'bold' }}>REQ</Typography>
                    <Typography variant="caption" sx={{ width: 60, textAlign: 'center', fontWeight: 'bold' }}>ACTUAL</Typography>
                </Box>

                <Stack spacing={0}>
                    <InfoRow label="Tons (TN)" requested={load.reqTon ? 'YES' : '-'} actual={load.actualTon || 0} />
                    <InfoRow label="Cubes (M3)" requested={load.reqM3 ? 'YES' : '-'} actual={load.actualM3 || 0} />
                    <InfoRow label="Pieces (KPL)" requested={load.req_pcs ? 'YES' : '-'} actual={load.actualPcs || 0} />
                </Stack>

                <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#999', fontWeight: 'bold', display: 'block' }}>INSTRUCTIONS:</Typography>
                    <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mt: 0.2 }}>
                        {load.driverNotes || 'No specific notes.'}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default PlanningTooltip;