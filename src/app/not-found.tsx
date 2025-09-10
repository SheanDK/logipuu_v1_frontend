// app/not-found.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Paper, Typography, Button, TextField } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

export default function NotFound() {
  const theme = useTheme();
  const r = typeof theme.shape.borderRadius === 'number'
    ? theme.shape.borderRadius * 2 : 16;

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      px: 2,
    }}>
      <Paper elevation={8} sx={{
        width: '100%', maxWidth: 920, p: { xs: 3, md: 6 },
        display: 'grid', gap: 3, justifyItems: 'center', textAlign: 'center',
        backgroundColor: alpha(theme.palette.background.paper, 0.88),
        backdropFilter: 'blur(10px)',
        borderRadius: r
      }}>
        <Image src="/images/softrain-logo.png" alt="Softrain" width={160} height={54} />

        <Typography variant="h1" sx={{ fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
          404
        </Typography>
        <Typography variant="h5">Sivu puuttuu</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 640 }}>
          Etsimääsi sivua ei löytynyt. Linkki voi olla vanhentunut tai osoite väärin.
        </Typography>

          <Link href="/" passHref>
            <Button variant="contained">Etusivulle</Button>
          </Link>
      </Paper>
    </Box>
  );
}
