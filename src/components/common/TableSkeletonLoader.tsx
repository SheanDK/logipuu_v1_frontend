// frontend/src/components/common/TableSkeletonLoader.tsx
'use client';

import React from 'react';
import { Box, Skeleton } from '@mui/material';

interface TableSkeletonLoaderProps {
    rows?: number;
}

export default function TableSkeletonLoader({ rows = 5 }: TableSkeletonLoaderProps) {
    return (
        <Box sx={{ p: 1 }}>
            {/* Create an array of a certain length and map over it to render skeleton rows */}
            {Array.from(new Array(rows)).map((_, index) => (
                <Skeleton key={index} variant="rectangular" height={52} sx={{ my: 1, borderRadius: 1 }} />
            ))}
        </Box>
    );
}
