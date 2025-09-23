// frontend/src/components/loads/SelectedTripPanel.tsx

'use client';

import React from 'react';
import { Box, Paper, Typography, Stack, Button, IconButton, Chip, Collapse, Divider } from '@mui/material';
import { ILoadListItem } from '@/types'; // Use ILoadListItem for summary
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

interface SelectedTripPanelProps {
    trip: ILoadListItem;
    onCloseAction: () => void; // To deselect the trip
    onEditAction: (trip: ILoadListItem) => void; // To trigger edit mode
    onStartAction: (trip: ILoadListItem) => void; // To start the trip
}

export default function SelectedTripPanel({ trip, onCloseAction, onEditAction, onStartAction }: SelectedTripPanelProps) {
    const [expanded, setExpanded] = React.useState(true);

    const handleToggleExpand = () => {
        setExpanded(!expanded);
    };

    return (
        <Paper
            elevation={8}
            sx={{
                position: 'absolute',
                bottom: { xs: 'auto', sm: 32 }, // On small screens, stick to top
                top: { xs: 80, sm: 'auto' }, // To be below the Create Trip button
                left: { xs: 16, sm: '50%' },
                transform: { xs: 'none', sm: 'translateX(-50%)' },
                zIndex: 1050,
                width: { xs: 'calc(100% - 32px)', sm: 500 },
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                overflow: 'hidden' // Important for rounded corners with collapse
            }}
        >
            {/* Header section - always visible */}
            <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center' }}>
                <Stack sx={{ flexGrow: 1 }}>
                    <Typography variant="overline" lineHeight={1.2}>Selected Trip</Typography>
                    <Typography variant="h6" fontWeight={600}>{trip.ajomaaraysNro || `Load #${trip.kuormaId}`}</Typography>
                </Stack>
                <Chip label={trip.status} color="primary" sx={{ mx: 2 }} />
                <IconButton onClick={handleToggleExpand}>
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <IconButton onClick={onCloseAction}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Collapsible section with more details and actions */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ px: 2, pb: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1.5}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Customer</Typography>
                            <Typography>{trip.asiakkaanNimi}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Route</Typography>
                            <Typography>{trip.lahto} → {trip.kohde}</Typography>
                        </Box>
                    </Stack>

                    {/* Action buttons - shown based on trip status */}
                    {trip.status === 'Assigned' && (
                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<PlayCircleOutlineIcon />}
                                onClick={() => onStartAction(trip)}
                                sx={{ flex: 1 }}
                            >
                                Start Trip
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => onEditAction(trip)}
                            >
                                Edit
                            </Button>
                        </Stack>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
}