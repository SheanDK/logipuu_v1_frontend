// frontend/src/types/layout.ts
export type ThemeMode = 'light' | 'dark';
export type NavLayout = 'top' | 'left'; // 'top' for links in appbar, 'left' for links in sidebar

export interface LayoutSettings {
    themeMode: ThemeMode;
    navLayout: NavLayout;
}

export interface LayoutContextType extends LayoutSettings {
    toggleThemeMode: () => void;
    setThemeMode: (mode: ThemeMode) => void;
    toggleNavLayout: () => void;
    setNavLayout: (layout: NavLayout) => void;
    mobileDrawerOpen: boolean;
    toggleMobileDrawer: () => void;
}