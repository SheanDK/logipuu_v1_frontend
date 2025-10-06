// frontend/src/app/components/i18n/LanguageSwitcher.tsx
'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams, useParams } from 'next/navigation';
import i18next from 'i18next';
import { languages, fallbackLng } from '@/i18n/settings';
import { Button, Menu, MenuItem, ListItemText } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from '@/i18n/useTranslation';

// Escape a string for safe use inside a RegExp pattern
function escapeForRegex(s: string) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export default function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname() || '/';
    const searchParams = useSearchParams();
    const params = useParams() as { lng?: string };
    const { t } = useTranslation('navbar');

    // Determine current language from the URL (fallback if missing)
    const currentLang = (params.lng && languages.includes(params.lng)) ? params.lng : fallbackLng;

    // Simple menu state
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const openMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
    const closeMenu = () => setAnchorEl(null);

    // Build a new href:
    // - If a leading /fi|/en is present, replace it
    // - If not, prefix the path with /{lng}
    // - Preserve the current query string
    const buildHref = (lng: string) => {
        const group = languages.map(escapeForRegex).join('|');
        const re = new RegExp(`^/(?:${group})(?=/|$)`); // detect leading language prefix
        const hasPrefix = re.test(pathname);

        const newPath = hasPrefix
            ? pathname.replace(re, `/${lng}`)                              // replace existing prefix
            : `/${lng}${pathname.startsWith('/') ? '' : '/'}${pathname}`; // add prefix if missing

        const qs = searchParams?.toString();
        return qs ? `${newPath}?${qs}` : newPath;
    };

    const switchTo = (lng: string) => {
        if (!languages.includes(lng)) return;

        // 1) Persist the user’s choice for 1 year
        document.cookie = `i18nextLng=${lng}; path=/; max-age=31536000; SameSite=Lax`;

        // 2) Update i18next immediately to minimize UI flicker
        if (i18next.language !== lng) {
            i18next.changeLanguage(lng).catch(() => { });
        }

        // 3) Navigate to the same view with the new language prefix
        router.replace(buildHref(lng));
        closeMenu();
    };

    return (
        <>
            <Tooltip title={t('tooltips.language')} arrow>
                <Button
                    onClick={openMenu}
                    color="inherit"
                    startIcon={<LanguageIcon />}
                    sx={{ ml: 1, textTransform: 'none' }}
                    aria-haspopup="menu"
                    aria-controls="language-menu"
                    aria-expanded={open ? 'true' : undefined}
                >
                    {currentLang.toUpperCase()}
                </Button>
            </Tooltip>

            <Menu id="language-menu" anchorEl={anchorEl} open={open} onClose={closeMenu}>
                {languages.map((lng) => (
                    <MenuItem
                        key={lng}
                        selected={lng === currentLang}
                        onClick={() => switchTo(lng)}
                    >
                        <ListItemText>{lng.toUpperCase()}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
