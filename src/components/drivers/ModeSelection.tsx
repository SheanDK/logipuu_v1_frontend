// frontend/src/components/drivers/ModeSelection.tsx
'use client';

import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import ForestIcon from '@mui/icons-material/Forest';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const ModeCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: theme.shadows[8],
    },
}));

interface ModeSelectionProps {
    onModeSelectAction: (mode: 'timber' | 'consignment') => void;
}

export default function ModeSelection({ onModeSelectAction }: ModeSelectionProps) {
    return (
        <Box 
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 3,
            }}
        >
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                Select Your Work Mode
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 5, maxWidth: 500, textAlign: 'center' }}>
                Choose the type of job you will be performing for this session.
            </Typography>
            <Grid container spacing={4} justifyContent="center" maxWidth="md">
                <Grid item xs={12} sm={6} md={5}>
                    <ModeCard elevation={4} onClick={() => onModeSelectAction('timber')}>
                        <ForestIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight={600}>
                            Timber Loads
                        </Typography>
                        <Typography color="text.secondary">
                            (Puulaani)
                        </Typography>
                    </ModeCard>
                </Grid>
                <Grid item xs={12} sm={6} md={5}>
                    <ModeCard elevation={4} onClick={() => onModeSelectAction('consignment')}>
                        <LocalShippingIcon sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight={600}>
                            Consignments
                        </Typography>
                        <Typography color="text.secondary">
                            (Rahtikirja)
                        </Typography>
                    </ModeCard>
                </Grid>
            </Grid>
        </Box>
    );
}