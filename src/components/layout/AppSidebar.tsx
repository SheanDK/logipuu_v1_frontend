// src/components/layout/AppSidebar.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Import useMemo and useCallback
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Toolbar, Box, Collapse, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { navigationItems, NavItemConfig } from '../../config/navConfig';

const drawerWidth = 240;

export default function AppSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { mobileDrawerOpen, toggleMobileDrawer } = useLayout();
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    // --- FIX 1: Memoize the filtered navigation items ---
    // This ensures that `sidebarNavLinks` is not recreated on every single render,
    // only when the `user` object changes.
    const sidebarNavLinks = useMemo(() => {
        if (!user) return [];
        
        const filterItems = (items: NavItemConfig[]): NavItemConfig[] => {
            return items.map(item => {
                if (item.children) {
                    const visibleChildren = filterItems(item.children);
                    if (visibleChildren.length > 0) {
                        return { ...item, children: visibleChildren };
                    }
                    return null;
                }
                if (item.permission && !user.permissions?.includes(item.permission)) return null;
                if (item.roles && !item.roles.some(role => user.roles.includes(role))) return null;
                return item;
            }).filter(Boolean) as NavItemConfig[];
        };

        return filterItems(navigationItems);
    }, [user]); // Dependency is only `user`

    // --- FIX 2: Correct the dependency array of useEffect ---
    // This effect now only runs when the path or the (stable) nav links change.
    useEffect(() => {
        const activeParent = sidebarNavLinks.find(item => 
            item.children?.some(child => child.path && pathname.startsWith(child.path))
        );
        if (activeParent) {
            // Check if it's not already open to prevent unnecessary re-renders
            if (!openCategories[activeParent.text]) {
                setOpenCategories(prev => ({ ...prev, [activeParent.text]: true }));
            }
        }
    }, [pathname, sidebarNavLinks]); // `openCategories` is removed from dependency array

    const handleCategoryClick = (itemText: string) => {
        setOpenCategories(prev => ({ ...prev, [itemText]: !prev[itemText] }));
    };

    const drawerContent = (
        <div>
            <Toolbar />
            <Divider />
            <List sx={{ p: 1 }}>
                {sidebarNavLinks.map((item) => {
                    const isCategoryOpen = openCategories[item.text] || false;
                    const isParentActive = item.children?.some(child => child.path && pathname.startsWith(child.path));
                    
                    if (item.children) {
                        return (
                            <React.Fragment key={item.text}>
                                <ListItemButton onClick={() => handleCategoryClick(item.text)} sx={{ borderRadius: 1.5, mb: 0.5 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 'medium', color: isParentActive ? 'primary' : 'inherit' }} />
                                    {isCategoryOpen ? <ExpandLess /> : <ExpandMore />}
                                </ListItemButton>
                                <Collapse in={isCategoryOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding sx={{ pl: 2 }}>
                                        {item.children.map(child => {
                                            const isChildActive = pathname === child.path;
                                            return (
                                                <ListItem key={child.path} disablePadding sx={{ mb: 0.5 }}>
                                                    <ListItemButton component={Link} href={child.path!} selected={isChildActive} sx={{ borderRadius: 1.5 }} onClick={() => { if (mobileDrawerOpen) toggleMobileDrawer(); }}>
                                                        <ListItemIcon sx={{ minWidth: 40 }}>{child.icon}</ListItemIcon>
                                                        <ListItemText primary={child.text} primaryTypographyProps={{ variant: 'body2' }}/>
                                                    </ListItemButton>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </Collapse>
                            </React.Fragment>
                        );
                    }
                    // This is a single link
                    return (
                         <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton component={Link} href={item.path!} selected={pathname === item.path} sx={{ borderRadius: 1.5 }} onClick={() => { if (mobileDrawerOpen) toggleMobileDrawer(); }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 'medium' }} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </div>
    );
    
    return (
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
            <Drawer variant="temporary" open={mobileDrawerOpen} onClose={toggleMobileDrawer} ModalProps={{ keepMounted: true }}
                sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
            >
                {drawerContent}
            </Drawer>
            <Drawer variant="permanent"
                sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}