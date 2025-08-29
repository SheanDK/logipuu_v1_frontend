// src/utils/useLeafletPopupTheme.ts
'use client';

import { useEffect } from 'react';
import { useTheme } from '@mui/material';

/**
 * Custom hook that updates Leaflet popup styles to match MUI theme.
 */
export function useLeafletPopupTheme() {
  const theme = useTheme();

  useEffect(() => {
    const applyThemeToPopup = () => {
      const popupBg = theme.palette.background.paper;
      const popupColor = theme.palette.text.primary;

      const wrappers = document.querySelectorAll('.leaflet-popup-content-wrapper');
      wrappers.forEach(el => {
        (el as HTMLElement).style.backgroundColor = popupBg;
        (el as HTMLElement).style.color = popupColor;
      });

      const tips = document.querySelectorAll('.leaflet-popup-tip');
      tips.forEach(el => { (el as HTMLElement).style.backgroundColor = popupBg; });
    };

    applyThemeToPopup();
    const observer = new MutationObserver(applyThemeToPopup);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [theme.palette.mode, theme.palette.background.paper, theme.palette.text.primary]);
}