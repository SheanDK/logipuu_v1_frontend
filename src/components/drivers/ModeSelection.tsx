// frontend/src/components/drivers/ModeSelection.tsx
'use client';

import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import ForestIcon from '@mui/icons-material/Forest';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { useTranslation } from 'react-i18next';

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
    onModeSelectAction: (mode: 'timber' | 'consignment' | 'chip') => void;
}

export default function ModeSelection({ onModeSelectAction }: ModeSelectionProps) {
    const { t } = useTranslation('modeSelection');

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
                {t('mode.title')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 5, maxWidth: 500, textAlign: 'center' }}>
                {t('mode.subtitle')}
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 4,
                    width: '100%',
                    maxWidth: '900px',
                    justifyItems: 'center',
                }}
                role="list"
                aria-label={t('mode.ariaList')}
            >
                <Box role="listitem" sx={{ width: '100%', maxWidth: 420 }}>
                    <ModeCard elevation={4} onClick={() => onModeSelectAction('timber')}>
                        <ForestIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight={600}>
                            {t('mode.timber.title')}
                        </Typography>
                        <Typography color="text.secondary">
                            {t('mode.timber.subtitle')}
                        </Typography>
                    </ModeCard>
                </Box>
                <Box role="listitem" sx={{ width: '100%', maxWidth: 420 }}>
                    <ModeCard elevation={4} onClick={() => onModeSelectAction('consignment')}>
                        <LocalShippingIcon sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight={600}>
                            {t('mode.consignment.title')}
                        </Typography>
                        <Typography color="text.secondary">
                            {t('mode.consignment.subtitle')}
                        </Typography>
                    </ModeCard>
                </Box>
                <Box role="listitem" sx={{ width: '100%', maxWidth: 420 }}>
                    <ModeCard elevation={4} onClick={() => onModeSelectAction('chip')}>
                        <LocalFireDepartmentIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight={600}>
                            {t('mode.chip.title')}
                        </Typography>
                        <Typography color="text.secondary">
                            {t('mode.chip.subtitle')}
                        </Typography>
                    </ModeCard>
                </Box>
            </Box>
        </Box>
    );
}
