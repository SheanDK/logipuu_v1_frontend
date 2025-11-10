// src/utils/displayHelpers.ts

// CORRECTED: Import the correct enum name and basic info types
import { ClientTypeEnum } from '../types';

/**
 * Converts a numeric client type enum into a human-readable string.
 * @param type - The numeric client type (0, 1, or 2).
 * @returns A string representing the client type.
 */
export const getClientTypeString = (type: ClientTypeEnum | undefined | null): string => {
    if (type === null || typeof type === 'undefined') {
        return 'N/A';
    }

    switch (type) {
        case ClientTypeEnum.PUULAANI:
            return 'Puulaani';
        case ClientTypeEnum.RAHTIKIRJA:
            return 'Rahtikirja';
        case ClientTypeEnum.BOTH:
            return 'Puulaani & Rahtikirja';
        default:
            return 'Unknown';
    }
};

/**
 * Formats an ISO date string into a localized date string (e.g., DD.MM.YYYY).
 * @param isoDateString - The date string from the API.
 * @returns A formatted date string or 'N/A'.
 */
export const formatLocalDate = (isoDateString: string | null | undefined): string => {
    if (!isoDateString) return 'N/A';
    try {
        const date = new Date(isoDateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        // Using Finnish locale for DD.MM.YYYY format
        return date.toLocaleDateString('fi-FI');
    } catch (error) {
        console.error("Error formatting date:", isoDateString, error);
        return 'N/A';
    }
};

export const formatCoordinates = (lat: number | string, lng: number | string): string => {
    const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
    const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;

    if (isNaN(latitude) || isNaN(longitude)) {
        return 'Invalid Coordinates';
    }
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};