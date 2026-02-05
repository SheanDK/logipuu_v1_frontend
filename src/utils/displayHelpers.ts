// src/utils/displayHelpers.ts

// CORRECTED: Import the correct enum name and basic info types
import { ClientTypeEnum } from '../types';
import i18n from '@/i18n/i18n';
import { TFunction } from 'i18next';

/**
 * Converts a numeric client type enum into a human-readable string.
 * Uses a provided TFunction (or i18n.t) for localization.
 */
export const getClientTypeString = (type: ClientTypeEnum | undefined | null, t?: TFunction): string => {
    if (type === null || typeof type === 'undefined') {
        return 'N/A';
    }

    const translate = t || i18n.t;

    switch (type) {
        case ClientTypeEnum.PUULAANI:
            return translate('common:clientTypes.puulaani', { defaultValue: 'Timber Stack' });
        case ClientTypeEnum.RAHTIKIRJA:
            return translate('common:clientTypes.rahtikirja', { defaultValue: 'Consignment' });
        case ClientTypeEnum.BOTH:
            return translate('common:clientTypes.both', { defaultValue: 'Both' });
        default:
            return translate('common:status.unknown', { defaultValue: 'Unknown' });
    }
};

/**
 * Formats an ISO date string into a localized date string.
 */
export const formatLocalDate = (isoDateString: string | null | undefined): string => {
    if (!isoDateString) return 'N/A';
    try {
        const date = new Date(isoDateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        // Use the current direction and language from i18n
        return date.toLocaleDateString(i18n.language);
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