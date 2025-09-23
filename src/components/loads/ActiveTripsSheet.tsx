// frontend/src/components/loads/ActiveTripsSheet.tsx

'use client';

import React from 'react';
import { 
    Box, Drawer, Typography, List, ListItemButton, ListItemText, 
    Divider, IconButton, Chip, Stack, styled,
    Menu,
    MenuItem
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import { ILoadListItem } from '@/types';

// A styled component for the "grab handle" on top of the sheet
const Puller = styled(Box)(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[400] : theme.palette.grey[900],
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    left: 'calc(50% - 15px)',
}));

interface ActiveTripsSheetProps {
    open: boolean;
    onCloseAction: () => void;
    trips: ILoadListItem[];
    onTripSelectAction: (tripId: number | null) => void;
    onViewDetailsAction: (tripId: number | null) => void;
    onEditTripAction: (tripId: number) => void;
}

// A small component to handle the action menu for each trip
const TripActionsMenu = ({ trip, onView, onEdit }: { trip: ILoadListItem, onView: () => void, onEdit: () => void }) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation(); // Prevent the ListItem's onClick
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => setAnchorEl(null);

    return (
        <>
            <IconButton size="small" onClick={handleClick}><MoreVertIcon fontSize="small" /></IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem onClick={() => { onView(); handleClose(); }}><VisibilityIcon sx={{ mr: 1 }} fontSize="small" /> View Details</MenuItem>
                {trip.status === 'Assigned' && (
                    <MenuItem onClick={() => { onEdit(); handleClose(); }}><EditIcon sx={{ mr: 1 }} fontSize="small" /> Edit Trip</MenuItem>
                )}
            </Menu>
        </>
    );
};

export default function ActiveTripsSheet({ open, onCloseAction, trips, onTripSelectAction, onViewDetailsAction, onEditTripAction }: ActiveTripsSheetProps) {
    return (
        <Drawer
            anchor="bottom"
            open={open}
            onClose={onCloseAction}
            PaperProps={{
                sx: {
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    height: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderColor: 'rgba(224, 224, 224, 0.6)',
                    boxShadow: '0px -8px 40px -12px rgba(0,0,0,0.3)',
                }
            }}
        >
            <Puller />
            <Box sx={{ p: 2, pb: 1, textAlign: 'center' }}>
                <Typography variant="h6">My Active Trips ({trips.length})</Typography>
            </Box>
            <Divider />
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {trips.length > 0 ? (
                    <List sx={{ pt: 0 }}>
                        {trips.map((trip) => (
                            <ListItemButton 
                                key={trip.kuormaId} 
                                onClick={() => onTripSelectAction(trip.kuormaId)}
                                divider
                            >
                                <ListItemText
                                    primary={`Trip: ${trip.ajomaaraysNro || `Load #${trip.kuormaId}`}`}
                                    secondaryTypographyProps={{ component: 'div' }}
                                    secondary={
                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                            <Typography variant="body2" component="span" color="text.secondary">
                                                Customer: <Typography component="span" color="text.primary">{trip.asiakkaanNimi}</Typography>
                                            </Typography>
                                            <Typography variant="body2" component="span" color="text.secondary">
                                                Route: <Typography component="span" color="text.primary">{trip.lahto} → {trip.kohde}</Typography>
                                            </Typography>
                                        </Stack>
                                    }
                                />
                                <Stack direction="column" alignItems="flex-end" spacing={1}>
                                    <Chip label={trip.status} size="small" color="primary" variant="outlined" />
                                    <IconButton 
                                        size="small" 
                                        title="View Full Details & Actions"
                                        onClick={(e) => { 
                                            e.stopPropagation(); // Prevent the ListItem's onClick from firing
                                            onViewDetailsAction(trip.kuormaId); 
                                        }}
                                    >
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </ListItemButton>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography>No active trips found.</Typography>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}