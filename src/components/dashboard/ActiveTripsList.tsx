//frontend/src/components/dashboard/ActiveTripsList.tsx
import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Box, LinearProgress } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { IActiveTripListItem } from '@/types';
import { useTranslation } from 'react-i18next';

interface ActiveTripsListProps {
    data: IActiveTripListItem[];
}

export default function ActiveTripsList({ data }: ActiveTripsListProps) {
    const { t } = useTranslation('dashboard');
    return (
        <Paper sx={{ 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            borderRadius: '16px', 
            boxShadow: 3,
            maxHeight: '450px',
        }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
               {t('activeTrips.title')}
            </Typography>
            {data.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '150px' }}>
                    <Typography color="text.secondary">{t('activeTrips.noData')}</Typography>
                </Box>
            ) : (
                <List sx={{ overflowY: 'auto', flexGrow: 1, p: 0 }}>
                    {data.map((trip, index) => {
                        // --- FIX: Conditionally construct the primary text ---
                        const primaryText = trip.vehicleRegNo 
                            ? `${trip.driverName || t('activeTrips.unknownDriver')} (${trip.vehicleRegNo})` 
                            : trip.driverName || t('activeTrips.unknownDriver');

                        return (
                            <React.Fragment key={`${trip.ajomaaraysNro}-${index}`}>
                                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                                            <LocalShippingIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={primaryText} // Use the newly constructed text
                                        secondary={
                                            <Box sx={{ mt: 1, width: '100%' }}>
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    {trip.status}
                                                </Typography>
                                                <LinearProgress variant="determinate" value={trip.progress} sx={{ mt: 0.5, height: 6, borderRadius: 5 }} />
                                            </Box>
                                        }
                                        secondaryTypographyProps={{ component: 'div' }} 
                                    />
                                </ListItem>
                                {index < data.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        );
                    })}
                </List>
            )}
        </Paper>
    );
}