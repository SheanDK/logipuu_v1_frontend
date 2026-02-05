'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import i18next from '@/i18n/i18n';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
    const params = useParams() as { lng?: string };
    const lng = params.lng;

    useEffect(() => {
        if (lng && i18next.language !== lng) {
            i18next.changeLanguage(lng).then(() => {
                dayjs.locale(lng);
            });
        }
    }, [lng]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lng}>
            {children}
        </LocalizationProvider>
    );
}
