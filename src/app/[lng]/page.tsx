// src/app/[lng]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function LangIndexPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { lng } = useParams() as { lng: string };

  useEffect(() => {
    if (isLoading || !lng) return;
    router.replace(isAuthenticated ? `/${lng}/dashboard` : `/${lng}/login`);
  }, [isAuthenticated, isLoading, router, lng]);

  return (
    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <CircularProgress />
    </Box>
  );
}
