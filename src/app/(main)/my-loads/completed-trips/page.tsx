// frontend-web/src/app/(main)/completed-trips/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert,
    List, ListItem, ListItemText, Divider, IconButton, Button
} from '@mui/material';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { ILoadListItem } from '../../../../types';
import { fetchMyCompletedLoads } from '../../../../services/loadService';

export default function CompletedTripsPage() {
    const router = useRouter();
    const [trips, setTrips] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCompletedTrips = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchMyCompletedLoads();
                setTrips(data);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load completed trips.");
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
            return <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No completed trips found.</Typography>;
        }

        return (
            <List sx={{ p: 0 }}>
                {trips.map((trip, index) => (
                    <React.Fragment key={trip.kuormaId}>
                        <ListItem>
                            <ListItemText
                                primary={`Trip: ${trip.ajomaaraysNro || `Load #${trip.kuormaId}`}`}
                                secondary={`Completed on: ${dayjs(trip.pvm).format('DD MMM YYYY')} | Customer: ${trip.asiakkaanNimi}`}
                            />
                        </ListItem>
                        {index < trips.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
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
                        Back to Map
                    </Button>
                    <Typography variant="h6" component="h1">
                        Completed Trips
                    </Typography>
                </Box>
                {renderContent()}
            </Paper>
        </Box>
    );
}