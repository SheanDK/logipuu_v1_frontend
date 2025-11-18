//frontend/src/components/dashboard/TimberMapCard.tsx
'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Button, useTheme } from '@mui/material'; 
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function TimberMapCard() {
    const router = useRouter();
    const { t } = useTranslation('dashboard');
    const theme = useTheme(); // MUI theme

    const handleClick = () => {
        router.push('/timber-stacks');
    };

    return (
        // --- FIX: Add background gradient and animation to the Card ---
        <Card sx={{ 
            borderRadius: '16px', 
            boxShadow: 3, 
            color: 'white', 
            background: `linear-gradient(-45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, #23a6d5, #23d5ab)`,
            backgroundSize: '400% 400%', 
            
            animation: 'animatedGradient 15s ease infinite',
          
            '@keyframes animatedGradient': {
                '0%': {
                    backgroundPosition: '0% 50%'
                },
                '50%': {
                    backgroundPosition: '100% 50%'
                },
                '100%': {
                    backgroundPosition: '0% 50%'
                }
            },
        }}>
            <Box 
                onClick={handleClick}
                sx={{ 
                    p: 3,
                    cursor: 'pointer',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                    height: '100%',
                    transition: 'background-color 0.3s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.3)'
                    }
            }}>
                <Stack spacing={2} justifyContent="space-between" sx={{ height: '100%' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box>
                            <TravelExploreIcon sx={{ fontSize: 40, color: 'white' }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {t('mapCard.title', 'Live Timber Map')}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                {t('mapCard.description', 'View all active sites')}
                            </Typography>
                        </Box>
                    </Stack>
                    
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        endIcon={<ArrowForwardIcon />} 
                        sx={{ alignSelf: 'flex-end' }}
                        onClick={(e) => {
                            e.stopPropagation(); 
                            handleClick();
                        }}
                    >
                        {t('mapCard.button', 'Open Map')}
                    </Button>
                </Stack>
            </Box>
        </Card>
    );
}