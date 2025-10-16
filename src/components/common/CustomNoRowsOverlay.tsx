// frontend/src/components/common/CustomNoRowsOverlay.tsx
'use client';

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

interface CustomNoRowsOverlayProps {
    message?: string;
}

export default function CustomNoRowsOverlay({ message = "No data found" }: CustomNoRowsOverlayProps) {
    return (
        <Stack
            height="100%"
            alignItems="center"
            justifyContent="center"
            sx={{
                color: 'text.secondary',
                backgroundColor: (theme) => theme.palette.mode === 'light' ? '#f8f8f8' : theme.palette.background.default,
            }}
        >
            <InboxOutlinedIcon sx={{ fontSize: 64, mb: 1, opacity: 0.6 }} />
            <Typography variant="h6" component="p">
                {message}
            </Typography>
        </Stack>
    );
}