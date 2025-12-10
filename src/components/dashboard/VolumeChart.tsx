//frontend/src/components/dashboard/VolumeChart.tsx
'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { IVolumeByDay } from '@/types'; 
// --- Import useTranslation and i18n ---
import { useTranslation } from 'react-i18next';

// Helper function to format the date based on language
const formatDate = (dateString: string, lang: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(lang, { day: '2-digit', month: 'short' }).format(date);
};

const CustomTooltip = ({ active, payload, label, currentLang }: any) => {
     const { t } = useTranslation('dashboard');
  if (active && payload && payload.length) {
    const valueAsNumber = Number(payload[0].value);
    
    // --- Format the label (date) inside the tooltip ---
    return (
      <Paper elevation={3} sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'background.default' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {t('volumeChart.tooltip', { value: valueAsNumber.toFixed(2) })}
        </Typography>
      </Paper>
    );
  }
  return null;
};


interface VolumeChartProps {
    data: IVolumeByDay[];
    height?: string | number; 
}

export default function VolumeChart({ data, height = 400 }: VolumeChartProps) {
    // --- Get i18n instance to access current language ---
    const { t, i18n } = useTranslation('dashboard');
    const theme = useTheme();

    return (
        <Paper sx={{ 
            p: 3, 
            height: { xs: 400, lg: height || 400 },
            display: 'flex', 
            flexDirection: 'column', 
            borderRadius: '16px', 
            boxShadow: 3 
        }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                {t('volumeChart.title')}
            </Typography>
            
            {data.length === 0 ? (
                 <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                    <Typography>{t('volumeChart.noData')}</Typography>
                </Box>
            ) : (
                <Box sx={{ flexGrow: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                            <XAxis 
                                dataKey="date" 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} 
                                // --- Use tickFormatter to translate dates ---
                                tickFormatter={(value) => formatDate(value, i18n.language)}
                            />
                            <YAxis 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} 
                                unit=" m³" 
                                width={80}
                            />
                            {/* Pass currentLang if needed, though tickFormatter handles the axis */}
                            <Tooltip 
                                content={<CustomTooltip />} 
                                // format the label in the tooltip as well
                                labelFormatter={(value) => formatDate(value, i18n.language)}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="volume" 
                                stroke={theme.palette.primary.main} 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#colorVolume)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            )}
        </Paper>
    );
}