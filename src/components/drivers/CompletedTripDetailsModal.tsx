// frontend/src/components/drivers/CompletedTripDetailsModal.tsx
'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, IconButton, Box, Stack, Divider, CircularProgress, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
// Import useTranslation ---
import { useTranslation } from 'react-i18next';

// Interface for the data structure
interface CompletedTripDetails {
    kuormaId: number;
    pvm: string;
    asiakkaanNimi: string;
    lahto: string;
    kohde: string;
    rekNro: string;
    kuljettajanNimi: string;
    tyyppi: string;
    m3: number;
    km: number;
    lisatiedot: string;
}

interface CompletedTripDetailsModalProps {
    open: boolean;
    onCloseAction: () => void;
    tripDetails: CompletedTripDetails | null;
    isLoading: boolean;
}

// Reusable component for displaying a single detail item
const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <Box>
        <Typography 
            variant="body2" 
            color="text.secondary" 
            fontWeight="bold" 
            gutterBottom
        >
            {label}
        </Typography>
        <Typography 
        variant="body1" 
        noWrap>
            {value}
        </Typography>
    </Box>
);

export default function CompletedTripDetailsModal({ open, onCloseAction, tripDetails, isLoading }: CompletedTripDetailsModalProps) {
    const theme = useTheme();
    //Initialize translation hook ---
    const { t } = useTranslation('completedTripDetails');

    return (
        <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/*Translate Title --- */}
                {t('title')}
                <IconButton onClick={onCloseAction}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                ) : !tripDetails ? (
                    // Translate Error ---
                    <Typography color="error" sx={{ p: 2 }}>{t('error')}</Typography>
                ) : (
                    <Stack spacing={2}>
                        
                        {/* Top Section */}
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2 }}>
                            <Stack 
                                direction="row" 
                                spacing={2}
                                divider={<Divider orientation="vertical"  flexItem />}
                                sx={{ flexWrap: 'wrap' }} 
                            >
                                {/* --- Translate Labels --- */}
                                <DetailItem label={t('labels.date')}  value={new Date(tripDetails.pvm).toLocaleDateString()} />
                                <DetailItem label={t('labels.type')} value={tripDetails.tyyppi} />
                                <DetailItem label={t('labels.customer')} value={tripDetails.asiakkaanNimi || t('na')} />
                            </Stack>
                        </Paper>
                        
                        {/* Bottom Section */}
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2 }}>
                             <Stack 
                                direction="row" 
                                spacing={2}
                                divider={<Divider orientation="vertical" flexItem />}
                                sx={{ flexWrap: 'wrap' }}
                            >
                                <DetailItem label={t('labels.origin')} value={tripDetails.lahto || t('na')} />
                                <DetailItem label={t('labels.destination')} value={tripDetails.kohde || t('na')} />
                                <DetailItem label={t('labels.volume')} value={Number(tripDetails.m3).toFixed(2)} />
                                <DetailItem label={t('labels.distance')} value={Number(tripDetails.km).toFixed(2)} />
                            </Stack>
                        </Paper>
                        
                        {/* Optional Notes Section */}
                        {tripDetails.lisatiedot && (
                             <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2 }}>
                                <DetailItem label={t('labels.notes')} value={tripDetails.lisatiedot} />
                            </Paper>
                        )}
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
}