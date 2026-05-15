// frontend/src/contexts/SettingsContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://logipuu-v1-backend.onrender.com';
//const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const STORAGE_KEY = 'apiBaseUrl';

interface SettingsContextType {
    apiBaseUrl: string;
    setApiBaseUrl: (url: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [apiBaseUrl, setApiBaseUrlState] = useState<string>(DEFAULT_API_URL);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        try {
            const storedUrl = localStorage.getItem(STORAGE_KEY);
            if (storedUrl) {
                setApiBaseUrlState(storedUrl);
            }
        } catch (error) {
            console.warn("Could not read API base URL from localStorage.", error);
        }
        setIsInitialized(true);
    }, []);

    const setApiBaseUrl = (url: string) => {
        try {
            if (!url) {
                console.warn("Attempted to set an empty API base URL. Using default.");
                localStorage.removeItem(STORAGE_KEY);
                setApiBaseUrlState(DEFAULT_API_URL);
                return;
            }
            localStorage.setItem(STORAGE_KEY, url);
            setApiBaseUrlState(url);
        } catch (error) {
            console.error("Could not save API base URL to localStorage.", error);
        }
    };

    if (!isInitialized) {
        return null;
    }

    return (
        <SettingsContext.Provider value={{ apiBaseUrl, setApiBaseUrl }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};