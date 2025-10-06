'use client';

import React from 'react';
import { Box, Paper, Typography, Stack, Button, IconButton, Chip, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';

import { ILoadListItem } from '@/types'; // We'll use the list item type for summary data

interface TripMarkerPopupProps {
    trip: ILoadListItem;
    position: { x: number; y: number }; // Screen coordinates to position the popup
    onCloseAction: () => void;
    onDetailsClickAction: (tripId: number) => void;
}

export default function TripMarkerPopup({ trip, position, onCloseAction, onDetailsClickAction }: TripMarkerPopupProps) {
    if (!trip) return null;

    return (
        <Paper
            elevation={10}
            sx={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -100%)', // Position it above and centered on the marker
                zIndex: 1100, // Make sure it's above map tiles
                width: 300,
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                p: 1.5,
                // Add a little arrow pointing down
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    marginLeft: '-8px',
                    borderWidth: '8px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(255, 255, 255, 0.98) transparent transparent transparent',
                }
            }}
        >
            <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={600} noWrap>
                        {trip.ajomaaraysNro || `Trip #${trip.kuormaId}`}
                    </Typography>
                    <IconButton size="small" onClick={onCloseAction}><CloseIcon fontSize="small" /></IconButton>
                </Box>
                <Divider />
                <Stack spacing={0.5} sx={{ py: 1 }}>
                    <Typography variant="body2"><b>Client:</b> {trip.asiakkaanNimi}</Typography>
                    <Typography variant="body2"><b>Route:</b> {trip.lahto} → {trip.kohde}</Typography>
                    
                    {/* --- THIS IS THE FIX --- */}
                    {/* Explicitly convert trip.m3 to a Number before calling .toFixed() */}
                    <Typography variant="body2"><b>Volume:</b> {(Number(trip.m3) || 0).toFixed(2)} m³</Typography>
                    
                    <Box sx={{ pt: 1 }}>
                         <Chip label={trip.status} color="primary" size="small" />
                    </Box>
                </Stack>
                <Divider />
                <Button 
                    fullWidth 
                    variant="contained" 
                    sx={{ mt: 1 }}
                    startIcon={<ArticleIcon />}
                    onClick={() => onDetailsClickAction(trip.kuormaId)}
                >
                    Details / Actions
                </Button>
            </Stack>
        </Paper>
    );
}