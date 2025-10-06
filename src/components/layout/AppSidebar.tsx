// frontend/src/components/layout/AppSidebar.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Toolbar, Box, Collapse
} from '@mui/material';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { officeNavigationItems, driverNavigationItems, NavItemConfig } from '../../config/navConfig';
import { useTranslation } from '@/i18n/useTranslation';
import { withLng } from '@/utils/withLng';
import { languages, fallbackLng } from '@/i18n/settings';

const drawerWidth = 240;

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { mobileDrawerOpen, toggleMobileDrawer } = useLayout();
  const { t } = useTranslation(['navbar']);

  // Resolve the current language from the URL (fallback if missing)
  const { lng } = useParams() as { lng?: string };
  const currentLng = (lng && languages.includes(lng)) ? lng : fallbackLng;

  // Track which categories are open (keyed by translation key or fallback text)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Filter navigation items by user permissions/roles
  const sidebarNavLinks = useMemo(() => {
    if (!user) return [];

    const isDriver = user.roles.includes('Kuljettaja');
    const navigationItems = isDriver ? driverNavigationItems : officeNavigationItems;

    const filterItems = (items: NavItemConfig[]): NavItemConfig[] =>
      items
        .map(item => {
          if (item.children) {
            const visibleChildren = filterItems(item.children);
            if (visibleChildren.length > 0) return { ...item, children: visibleChildren };
            return null;
          }
          if (item.permission && !user.permissions?.includes(item.permission)) return null;
          if (item.roles && !item.roles.some(role => user.roles.includes(role))) return null;
          return item;
        })
        .filter(Boolean) as NavItemConfig[];

    return filterItems(navigationItems);
  }, [user]);

  // Auto-open the active parent category when route changes
  useEffect(() => {
    const activeParent = sidebarNavLinks.find(item =>
      item.children?.some(
        child => child.path && pathname.startsWith(withLng(currentLng, child.path))
      )
    );
    if (activeParent) {
      const key = activeParent.tKey ?? activeParent.text;
      if (key && !openCategories[key]) {
        setOpenCategories(prev => ({ ...prev, [key]: true }));
      }
    }
  }, [pathname, sidebarNavLinks, openCategories, currentLng]);

  // Toggle a category by its key
  const handleCategoryClick = (key: string) => {
    setOpenCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const drawerContent = (
    <div>
      <Toolbar />
      <Divider />
      <List sx={{ p: 1 }}>
        {sidebarNavLinks.map((item) => {
          // Use tKey when available, otherwise fallback to the plain text
          const itemKey = item.tKey;
          const isCategoryOpen = openCategories[itemKey] || false;

          const isParentActive = item.children?.some(
            child => child.path && pathname.startsWith(withLng(currentLng, child.path))
          );

          if (item.children) {
            return (
              <React.Fragment key={itemKey}>
                <ListItemButton
                  onClick={() => handleCategoryClick(itemKey)}
                  sx={{ borderRadius: 1.5, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  {/* Translate category title */}
                  <ListItemText
                    primary={t(`navbar.${itemKey}`)}
                    primaryTypographyProps={{
                      fontWeight: 'medium',
                      color: isParentActive ? 'primary' : 'inherit'
                    }}
                  />
                  {isCategoryOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={isCategoryOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 2 }}>
                    {item.children.map(child => {
                      const childKey = child.tKey;
                      const fullPath = withLng(currentLng, child.path!);
                      const isChildActive = pathname.startsWith(fullPath);

                      return (
                        <ListItem key={child.path} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            component={Link}
                            href={fullPath}
                            selected={isChildActive}
                            sx={{ borderRadius: 1.5 }}
                            onClick={() => { if (mobileDrawerOpen) toggleMobileDrawer(); }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>{child.icon}</ListItemIcon>
                            <ListItemText
                              primary={t(`navbar.${child.tKey}`)}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          // Leaf item (no children)
          const leafPath = item.path ? withLng(currentLng, item.path) : undefined;
          const isLeafActive = leafPath ? pathname.startsWith(leafPath) : false;

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={leafPath ?? '#'}
                selected={isLeafActive}
                sx={{ borderRadius: 1.5 }}
                onClick={() => { if (mobileDrawerOpen) toggleMobileDrawer(); }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={t(`navbar.${itemKey}`)}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={toggleMobileDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
