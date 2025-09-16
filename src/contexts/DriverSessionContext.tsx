// frontend/src/contexts/DriverSessionContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface DriverSessionState {
    selectedVehicleId: string | null;
    selectedVehicleRegNo: string | null;
    selectVehicle: (vehicleId: string, regNo: string) => void;
    clearVehicle: () => void;
    isVehicleSelectionRequired: boolean;
}

const DriverSessionContext = createContext<DriverSessionState | undefined>(undefined);

export const DriverSessionProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [selectedVehicleRegNo, setSelectedVehicleRegNo] = useState<string | null>(null);

    const isDriver = useMemo(() => user?.roles.includes('Kuljettaja') || false, [user]);
    
    // Logic to determine if the vehicle selection modal needs to be shown.
    const isVehicleSelectionRequired = useMemo(() => {
        return isDriver && !selectedVehicleId;
    }, [isDriver, selectedVehicleId]);

    const selectVehicle = (vehicleId: string, regNo: string) => {
        setSelectedVehicleId(vehicleId);
        setSelectedVehicleRegNo(regNo);
        // You could also save this to localStorage to remember for the next session
    };
    
    const clearVehicle = () => {
        setSelectedVehicleId(null);
        setSelectedVehicleRegNo(null);
    };

    // Automatically clear vehicle selection when user logs out
    useEffect(() => {
        if (!user) {
            clearVehicle();
        }
    }, [user]);

    const value = {
        selectedVehicleId,
        selectedVehicleRegNo,
        selectVehicle,
        clearVehicle,
        isVehicleSelectionRequired,
    };

    return (
        <DriverSessionContext.Provider value={value}>
            {children}
        </DriverSessionContext.Provider>
    );
};

export const useDriverSession = (): DriverSessionState => {
    const context = useContext(DriverSessionContext);
    if (context === undefined) {
        throw new Error('useDriverSession must be used within a DriverSessionProvider');
    }
    return context;
};