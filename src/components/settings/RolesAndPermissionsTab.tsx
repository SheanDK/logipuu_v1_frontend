// src/components/settings/RolesAndPermissionsTab.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, JSX } from 'react';
import {
    Box, Typography, Grid, List, ListItemButton, ListItemIcon, ListItemText,
    FormGroup, FormControlLabel, Checkbox, Button, AlertColor, Card, CardContent,
    CardHeader, Stack, Tooltip, CircularProgress
} from '@mui/material';
import { IRole, IPermission } from '../../types';
import { fetchRolesAndPermissions, fetchAllPermissions, updatePermissionsForRole } from '../../services/roleService';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const groupPermissionsByResource = (permissions: IPermission[]): Record<string, IPermission[]> => {
    if (!permissions || permissions.length === 0) return {};
    const grouped: Record<string, IPermission[]> = {};
    permissions.forEach(permission => {
        const resource = permission.permissionName.split('_')[0];
        if (!grouped[resource]) {
            grouped[resource] = [];
        }
        grouped[resource].push(permission);
    });
    return grouped; // This was missing
};

const getRoleIcon = (roleName: string): JSX.Element => {
    const lowerCaseRole = roleName.toLowerCase();
    if (lowerCaseRole.includes('superuser')) return <SupervisorAccountIcon />;
    if (lowerCaseRole.includes('admin')) return <AdminPanelSettingsIcon />;
    if (lowerCaseRole.includes('toimisto')) return <BusinessCenterIcon />;
    return <VpnKeyIcon />; 
};

interface RolesAndPermissionsTabProps {
    setFeedback: (feedback: { type: AlertColor; message: string } | null) => void;
}

const RolesAndPermissionsTab: React.FC<RolesAndPermissionsTabProps> = ({ setFeedback }) => {
    const [roles, setRoles] = useState<IRole[]>([]);
    const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);
    const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const groupedPermissions = useMemo(() => groupPermissionsByResource(allPermissions), [allPermissions]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [rolesData, permissionsData] = await Promise.all([
                fetchRolesAndPermissions(),
                fetchAllPermissions()
            ]);
            setRoles(rolesData);
            setAllPermissions(permissionsData);
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || "Failed to load roles and permissions." });
        } finally {
            setIsLoading(false);
        }
    }, [setFeedback]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        if (selectedRole) {
            setSelectedPermissionIds(new Set(selectedRole.permissionIds || []));
        } else {
            setSelectedPermissionIds(new Set());
        }
    }, [selectedRole]);

    const handleSaveChanges = async () => {
        if (!selectedRole) return;
        setIsSaving(true);
        setFeedback(null);
        try {
            await updatePermissionsForRole(selectedRole.rooliId, Array.from(selectedPermissionIds));
            setFeedback({ type: 'success', message: `Permissions for role "${selectedRole.roolinNimi}" updated successfully!` });
            
            // Refetch data to ensure UI is in sync
            const updatedRolesData = await fetchRolesAndPermissions();
            setRoles(updatedRolesData);
            
            // Reselect the role to show the updated permissions
            const newlyUpdatedRole = updatedRolesData.find(r => r.rooliId === selectedRole.rooliId);
            if (newlyUpdatedRole) {
                setSelectedRole(newlyUpdatedRole);
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Failed to save changes.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleRoleSelect = (role: IRole) => setSelectedRole(role);
    const handlePermissionChange = (permissionId: number, isChecked: boolean) => {
        setSelectedPermissionIds(prev => {
            const newSet = new Set(prev);
            if (isChecked) newSet.add(permissionId);
            else newSet.delete(permissionId);
            return newSet;
        });
    };
    const handleResourceToggle = (resource: string, isChecked: boolean) => {
        const resourcePermissionIds = groupedPermissions[resource]?.map(p => p.permissionId) || [];
        setSelectedPermissionIds(prev => {
            const newSet = new Set(prev);
            if (isChecked) resourcePermissionIds.forEach(id => newSet.add(id));
            else resourcePermissionIds.forEach(id => newSet.delete(id));
            return newSet;
        });
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Grid container spacing={4} sx={{ flex: 1, overflow: 'hidden', height: 'calc(100vh - 220px)' }}>
            <Grid item xs={12} md={4} lg={3} sx={{ borderRight: 1, borderColor: 'divider', height: '100%', overflowY: 'auto' }}>
                <Typography variant="h6" sx={{ pl: 2, pb: 1 }}>Roles</Typography>
                <List component="nav" dense>
                    {roles.map((role) => (
                        <ListItemButton key={role.rooliId} selected={selectedRole?.rooliId === role.rooliId} onClick={() => handleRoleSelect(role)}>
                            <ListItemIcon sx={{ minWidth: 36 }}>{getRoleIcon(role.roolinNimi)}</ListItemIcon>
                            <ListItemText primary={role.roolinNimi} />
                        </ListItemButton>
                    ))}
                </List>
            </Grid>
            <Grid item xs={12} md={8} lg={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {selectedRole ? (
                    <>
                        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                           <Typography variant="h5" component="h2" gutterBottom>Permissions for <Box component="span" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{selectedRole.roolinNimi}</Box></Typography>
                           <Grid container spacing={2}>
                                {Object.entries(groupedPermissions).map(([resource, permissions]) => {
                                    const allSelected = permissions.every(p => selectedPermissionIds.has(p.permissionId));
                                    const someSelected = permissions.some(p => selectedPermissionIds.has(p.permissionId)) && !allSelected;
                                    
                                    // --- FIX 1: Correctly format the resource title ---
                                    const resourceTitle = resource === 'timber' ? 'Timber Stacks' : resource;

                                    return (
                                        <Grid item xs={12} sm={6} lg={4} key={resource}>
                                            <Card elevation={2} sx={{ height: '100%' }}>
                                                <CardHeader
                                                    title={<FormControlLabel label={<Typography variant="subtitle1" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{resourceTitle}</Typography>} control={<Checkbox checked={allSelected} indeterminate={someSelected} onChange={(e) => handleResourceToggle(resource, e.target.checked)} size="small" />} />}
                                                    sx={{ bgcolor: 'action.hover', p: 1.5, borderBottom: 1, borderColor: 'divider' }}
                                                />
                                                <CardContent>
                                                    <FormGroup>
                                                        {permissions.map((permission) => {
                                                            // --- FIX 2: Correctly generate the permission label ---
                                                            const action = permission.permissionName.substring(resource.length + 1).replace('_', ' ');

                                                            return (
                                                                <Tooltip key={permission.permissionId} title={permission.description || ''} placement="right">
                                                                    <FormControlLabel control={<Checkbox checked={selectedPermissionIds.has(permission.permissionId)} onChange={(e) => handlePermissionChange(permission.permissionId, e.target.checked)} name={permission.permissionName} size="small" />} label={<Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{action}</Typography>} />
                                                                </Tooltip>
                                                            );
                                                        })}
                                                    </FormGroup>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                           </Grid>
                        </Box>
                        <Box sx={{ pt: 2, mt: 'auto', borderTop: 1, borderColor: 'divider', textAlign: 'right' }}>
                            <Button variant="contained" onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
                            </Button>
                        </Box>
                    </>
                ) : (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                        <AdminPanelSettingsIcon sx={{ fontSize: 60, mb: 2, color: 'text.secondary' }} />
                        <Typography variant="h6">Select a Role</Typography>
                        <Typography color="text.secondary">Select a role from the list to manage its permissions.</Typography>
                    </Stack>
                )}
            </Grid>
        </Grid>
    );
};

// --- KEY CORRECTION: Add the default export ---
export default RolesAndPermissionsTab;