//frontend/src/components/dashboard/StatCard.tsx
import React from 'react';
import { Card, Typography, Box, Stack } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactElement;
    color?: string;
    change?: string; // e.g., "+5.4%"
}

export default function StatCard({ title, value, icon, color = 'text.primary', change }: StatCardProps) {
    const { t } = useTranslation('dashboard');
    return (
        <Card sx={{
            p: 3,
            color: '#fff',
            backgroundImage: `linear-gradient(135deg, ${color} 0%, ${color}c0 100%)`,
            boxShadow: (theme) => `0 8px 16px 0 ${theme.palette.mode === 'dark' ? '#000000' : theme.palette.grey[500]}33`,
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Stack spacing={1}>
                {/* --- FIX: cloneElement , Box  style  --- */}
                <Box sx={{
                    width: 64, height: 64,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    mb: 2,
                    // Icon style 
                    '& .MuiSvgIcon-root': {
                        color: '#fff',
                        fontSize: 32,
                    }
                }}>
                    {icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>{title}</Typography>
                {change && (
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1, opacity: 0.9 }}>
                        <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                         <Typography variant="caption">{t('stats.comparison', { change: change })}</Typography>
                    </Stack>
                )}
            </Stack>
        </Card>
    );
}