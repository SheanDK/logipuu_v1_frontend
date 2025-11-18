//frontend/src/components/dashboard/VolumeChart.tsx
'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { IVolumeByDay } from '@/types'; 
import { useTranslation } from 'react-i18next';


const CustomTooltip = ({ active, payload, label }: any) => {
     const { t } = useTranslation('dashboard');
  if (active && payload && payload.length) {
    const valueAsNumber = Number(payload[0].value);

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
    const { t } = useTranslation('dashboard');
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
                            />
                            <YAxis 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} 
                                unit=" m³" 
                                width={80}
                            />
                            <Tooltip content={<CustomTooltip />} />
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