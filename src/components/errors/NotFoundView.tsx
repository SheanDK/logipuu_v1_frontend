'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Paper, Typography, Button } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from '@/i18n/useTranslation';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';

export default function NotFoundView() {
  const { t, i18n } = useTranslation('notFound');
  const pathname = usePathname();

  // Extract language from the first URL segment (e.g. /fi/..., /en/...)
  const lngFromPath = useMemo(() => {
    const seg = pathname?.split('/').filter(Boolean)[0];
    return seg === 'fi' || seg === 'en' ? seg : 'en'; // add more languages if needed
  }, [pathname]);

  // Sync i18n language with the URL (needed when coming from root not-found)
  useEffect(() => {
    if (i18n.language !== lngFromPath) {
      i18n.changeLanguage(lngFromPath);
    }
  }, [i18n, lngFromPath]);

  const theme = useTheme();
  const r = typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius * 2 : 16;

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Box sx={{ position: 'fixed', top: 12, right: 12, zIndex: (t) => t.zIndex.modal + 1, color: 'text.primary' }}>
        <LanguageSwitcher />
      </Box>

      <Paper elevation={8} sx={{
        width: '100%', maxWidth: 920, p: { xs: 3, md: 6 }, display: 'grid', gap: 3, justifyItems: 'center',
        textAlign: 'center', backgroundColor: alpha(theme.palette.background.paper, 0.88),
        backdropFilter: 'blur(10px)', borderRadius: r
      }}>
        <Image src="/images/softrain-logo.png" alt={t('brandAlt')} width={160} height={54} />
        <Typography variant="h1" sx={{ fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>404</Typography>
        <Typography variant="h5">{t('title')}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 640 }}>{t('description')}</Typography>

        {/* Redirect user to locale-specific homepage */}
        <Link href={`/${lngFromPath}`} passHref>
          <Button variant="contained">{t('homeCta')}</Button>
        </Link>
      </Paper>
    </Box>
  );
}
