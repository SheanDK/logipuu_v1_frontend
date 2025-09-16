// frontend/src/app/(main)/my-loads/completed/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
    Box, Typography, Paper, Alert, CircularProgress, Card, CardContent, 
    Divider, Stack, Grid, CardHeader, Chip, Button
} from '@mui/material';
import { useRouter } from 'next/navigation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';

import { ILoadListItem } from '../../../../types';
import { fetchMyCompletedLoads } from '../../../../services/loadService';

// A read-only card for displaying a completed trip
const CompletedLoadCard = ({ load }: { load: ILoadListItem }) => (
    <Card variant="outlined">
        <CardHeader
            titleTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            title={dayjs(load.pvm).format('DD MMMM YYYY')}
            action={<Chip label={load.status} size="small" color="success" variant="outlined" />}
            sx={{ pb: 1 }}
        />
        <Divider />
        <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
                <Box>
                    <Typography variant="caption" color="text.secondary">Origin</Typography>
                    <Typography fontWeight="bold" variant="h6">{load.lahto}</Typography>
                </Box>
                <ArrowForwardIcon sx={{ color: 'grey.400' }} />
                <Box>
                    <Typography variant="caption" color="text.secondary">Destination</Typography>
                    <Typography fontWeight="bold" variant="h6">{load.kohde}</Typography>
                </Box>
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Customer</Typography><Typography variant="body2">{load.asiakkaanNimi}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Vehicle</Typography><Typography variant="body2">{load.rekNro}</Typography></Grid>
            </Grid>
        </CardContent>
    </Card>
);

export default function CompletedTripsPage() {
    const router = useRouter();
    const [completedLoads, setCompletedLoads] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchMyCompletedLoads();
            setCompletedLoads(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch your completed trips.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>; }
    if (error) { return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>; }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
             <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => router.push('/my-loads')} 
                sx={{ mb: 2 }}
            >
                Back to Dashboard
            </Button>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
                My Completed Trips
            </Typography>
            
            {completedLoads.length > 0 ? (
                <Stack spacing={2}>
                    {completedLoads.map((load) => (
                        <CompletedLoadCard key={load.kuormaId} load={load} />
                    ))}
                </Stack>
            ) : (
                <Paper sx={{ p: 5, mt: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
                    <InboxOutlinedIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6">No Completed Trips Found</Typography>
                    <Typography color="text.secondary">Your completed trips will appear here.</Typography>
                </Paper>
            )}
        </Box>
    );
}