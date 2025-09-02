// frontend/src/app/(main)/my-loads/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Paper, Alert, CircularProgress, Card, CardContent, 
    CardActionArea, Divider, Stack, Grid, CardHeader, IconButton
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'; // Icon for empty state

import { ILoadListItem } from '../../../types';
import { fetchMyLoads } from '../../../services/loadService';

// A dedicated component for a single load card for better code organization
const LoadCard = ({ load, onClick }: { load: ILoadListItem, onClick: (id: number) => void }) => (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Card header for date and ID */}
        <CardHeader
            titleTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            title={load.pvm}
            action={
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold', mr: 1 }}>
                    #{load.kuormaId}
                </Typography>
            }
            sx={{ pb: 1 }}
        />
        <Divider />
        <CardContent sx={{ flexGrow: 1 }}>
            {/* Main trip details: Origin -> Destination */}
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
            
            {/* Secondary details: Customer & Vehicle */}
            <Divider sx={{ my: 1.5 }} />
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Customer</Typography>
                    <Typography variant="body2">{load.asiakkaanNimi}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                    <Typography variant="body2">{load.rekNro}</Typography>
                </Grid>
            </Grid>
        </CardContent>
        <Divider />
        {/* Action area to indicate clickability */}
        <CardActionArea onClick={() => onClick(load.kuormaId)} sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="button" color="primary">View Details</Typography>
            <ChevronRightIcon color="primary" />
        </CardActionArea>
    </Card>
);

export default function MyLoadsPage() {
    const [myLoads, setMyLoads] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getMyLoads = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await fetchMyLoads();
                setMyLoads(data);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to fetch your assigned loads.");
            } finally {
                setIsLoading(false);
            }
        };
        getMyLoads();
    }, []);

    const handleLoadClick = (loadId: number) => {
        // In Phase 2, this will navigate to the Load Details page.
        console.log(`Navigating to details for load ID: ${loadId}`);
        // Example: router.push(`/my-loads/${loadId}`);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
                My Assigned Loads
            </Typography>

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress size={50} />
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!isLoading && !error && (
                myLoads.length > 0 ? (
                    // --- FIX 1: Use a responsive Grid layout ---
                    <Grid container spacing={3}>
                        {myLoads.map((load) => (
                            <Grid item xs={12} sm={6} lg={4} key={load.kuormaId}>
                                <LoadCard load={load} onClick={handleLoadClick} />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    // --- FIX 3: Improved "Empty State" view ---
                    <Paper sx={{ p: 5, mt: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
                        <InboxOutlinedIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6">No Active Loads Assigned</Typography>
                        <Typography color="text.secondary">You have no pending tasks. Enjoy your break!</Typography>
                    </Paper>
                )
            )}
        </Box>
    );
}