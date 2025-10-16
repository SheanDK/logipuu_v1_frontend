// frontend/src/components/common/ErrorDisplay.tsx
'use client';

import React from 'react';
import { Alert, AlertTitle, Button, Stack } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';

interface ErrorDisplayProps {
    message: string;
    onRetry?: () => void; // A function to call when the retry button is clicked
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
    return (
        <Alert 
            severity="error" 
            sx={{ m: 3 }}
            // Add the retry button to the 'action' prop of the Alert component
            action={
                onRetry && ( // Only show the button if an onRetry function is provided
                    <Button 
                        color="inherit" 
                        size="small" 
                        startIcon={<ReplayIcon />}
                        onClick={onRetry}
                    >
                        Retry
                    </Button>
                )
            }
        >
            <AlertTitle>Error</AlertTitle>
            {message}
        </Alert>
    );
}