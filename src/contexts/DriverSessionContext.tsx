// frontend/src/contexts/DriverSessionContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';

const VEHICLE_ID_STORAGE_KEY = 'driver_vehicle_id';
const VEHICLE_REGNO_STORAGE_KEY = 'driver_vehicle_regno';
const ACTIVE_TRIP_ID_KEY = 'driver_active_trip_id';


interface DriverSessionState {
    selectedVehicleId: string | null;
    selectedVehicleRegNo: string | null;
    selectVehicle: (vehicleId: string, regNo: string) => void;
    clearVehicle: () => void;
    isVehicleSelectionRequired: boolean;
    isInitialized: boolean;

    activeTripId: string | null;
    setActiveTrip: (tripId: string | null) => void;
}

const DriverSessionContext = createContext<DriverSessionState | undefined>(undefined);

export const DriverSessionProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();

    //console.log("[DriverSession] CONTEXT PROVIDER RENDERING. Current user:", user);

    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [selectedVehicleRegNo, setSelectedVehicleRegNo] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        //console.log("[DriverSession] 1. First client-side effect running...");
        try {
            const storedVehicleId = localStorage.getItem(VEHICLE_ID_STORAGE_KEY);
            const storedVehicleRegNo = localStorage.getItem(VEHICLE_REGNO_STORAGE_KEY);

            //console.log(`[DriverSession] 2. Reading from localStorage: ID=${storedVehicleId}, RegNo=${storedVehicleRegNo}`);

            if (storedVehicleId && storedVehicleRegNo) {
                setSelectedVehicleId(storedVehicleId);
                setSelectedVehicleRegNo(storedVehicleRegNo);
                //console.log("[DriverSession] 3. State updated from localStorage.");
            }
        } catch (error) {
            console.error("Failed to read from localStorage", error);
        } finally {
            setIsInitialized(true);
            //console.log("[DriverSession] 4. Initialization FINISHED.");
        }
    }, []);

    const isDriver = useMemo(() => {
        const result = user?.roles.includes('Kuljettaja') || false;
        //console.log(`[DriverSession] Recalculating isDriver. User roles: ${user?.roles}, Result: ${result}`);
        return result;
    }, [user]);
    
    const isVehicleSelectionRequired = useMemo(() => {
        if (!isInitialized) {
            //console.log("[DriverSession] isVehicleSelectionRequired: FALSE (not initialized yet)");
            return false;
        }
        const result = isDriver && !selectedVehicleId;
        //console.log(`[DriverSession] isVehicleSelectionRequired: isDriver=${isDriver}, hasVehicle=${!!selectedVehicleId}. Result: ${result}`);
        return result;
    }, [isDriver, selectedVehicleId, isInitialized]);

    const selectVehicle = (vehicleId: string, regNo: string) => {
        //console.log(`[DriverSession] SAVING vehicle to localStorage: ID=${vehicleId}`);
        localStorage.setItem(VEHICLE_ID_STORAGE_KEY, vehicleId);
        localStorage.setItem(VEHICLE_REGNO_STORAGE_KEY, regNo);
        setSelectedVehicleId(vehicleId);
        setSelectedVehicleRegNo(regNo);
    };

    const [activeTripId, setActiveTripIdState] = useState<string | null>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem(ACTIVE_TRIP_ID_KEY);
        return null;
    });

    const setActiveTrip = (tripId: string | null) => {
        if (tripId) {
            localStorage.setItem(ACTIVE_TRIP_ID_KEY, tripId);
            setActiveTripIdState(tripId);
        } else {
            localStorage.removeItem(ACTIVE_TRIP_ID_KEY);
            setActiveTripIdState(null);
        }
    };
    
    const clearVehicle = () => {
        //console.warn("[DriverSession] CLEARING vehicle from state and localStorage!");
        localStorage.removeItem(VEHICLE_ID_STORAGE_KEY);
        localStorage.removeItem(VEHICLE_REGNO_STORAGE_KEY);
        setSelectedVehicleId(null);
        setSelectedVehicleRegNo(null);
        setActiveTrip(null);
    };

    useEffect(() => {
        //console.log(`[DriverSession] User object changed. Current user:`, user);
        // This is the problematic effect. Only clear if the user is explicitly null and we are initialized.
        if (isInitialized && !user) {
            //console.warn("[DriverSession] User is null, clearing vehicle session.");
            clearVehicle();
        }
    }, [user, isInitialized]);

    const value = { 
        selectedVehicleId, 
        selectedVehicleRegNo, 
        selectVehicle, 
        clearVehicle, 
        isVehicleSelectionRequired, 
        isInitialized,
        activeTripId,
        setActiveTrip,
    
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