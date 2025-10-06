// frontend/src/app/(main)/dashboard/page.tsx
'use client';
import React from 'react';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../../../contexts/AuthContext'; // To access user info

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <Typography variant="body1">
                Welcome, {user?.fullName || 'User'}!
            </Typography>
            <Typography variant="body2">
                Your role(s): {user?.roles?.join(', ')}
            </Typography>
            {user?.driverNumericId && (
                <Typography variant="body2">
                    Your Driver ID (KuljID): {user.driverNumericId}
                </Typography>
            )}
            {/* Dashboard content goes here */}
        </div>
    );
}