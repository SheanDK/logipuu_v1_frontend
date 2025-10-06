// frontend-web/src/app/(main)/completed-trips/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert,
    List, ListItem, ListItemText, Divider, IconButton, Button
} from '@mui/material';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/fi';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { ILoadListItem } from '../../../../../types';
import { fetchMyCompletedLoads } from '../../../../../services/loadService';
import { useTranslation } from '@/i18n/useTranslation';

export default function CompletedTripsPage() {
    const router = useRouter();
    const [trips, setTrips] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t, i18n } = useTranslation(['completedTrips']);

    // Update the dayjs locale to match the i18n language
    useEffect(() => {
        dayjs.locale(i18n.language?.startsWith('fi') ? 'fi' : 'en');
    }, [i18n.language]);

    useEffect(() => {
        const loadCompletedTrips = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchMyCompletedLoads();
                setTrips(data);
            } catch (err: any) {
                setError(err.response?.data?.message || t('errors.loadFailed'));
            } finally {
                setIsLoading(false);
            }
        };

        loadCompletedTrips();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
        }

        if (error) {
            return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
        }

        if (trips.length === 0) {
            return <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>{t('empty')}</Typography>;
        }

        return (
            <List sx={{ p: 0 }}>
                {trips.map((trip, index) => {
                    const label =
                        trip.ajomaaraysNro ||
                        t('item.fallbackLabel', { id: trip.kuormaId });

                    const dateStr = dayjs(trip.pvm).format(t('dateFormat'));

                    return (
                        <React.Fragment key={trip.kuormaId}>
                            <ListItem>
                                <ListItemText
                                    primary={t('item.primary', { label })}
                                    secondary={t('item.secondary', {
                                        date: dateStr,
                                        customer: trip.asiakkaanNimi,
                                    })}
                                />
                            </ListItem>
                            {index < trips.length - 1 && <Divider />}
                        </React.Fragment>
                    );
                })}
            </List>
        );
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '960px', mx: 'auto' }}>
            <Paper variant="outlined">
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/my-loads')}
                        sx={{ mr: 2 }}
                    >
                        {t('buttons.backToMap')}
                    </Button>
                    <Typography variant="h6" component="h1">
                        {t('title')}
                    </Typography>
                </Box>
                {renderContent()}
            </Paper>
        </Box>
    );
}