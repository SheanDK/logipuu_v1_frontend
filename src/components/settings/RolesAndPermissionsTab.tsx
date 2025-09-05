// src/components/settings/RolesAndPermissionsTab.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, JSX } from 'react';
import {
  Box, Typography, Grid, List, ListItemButton, ListItemIcon, ListItemText,
  FormGroup, FormControlLabel, Checkbox, Button, AlertColor, Card, CardContent,
  CardHeader, Stack, Tooltip, CircularProgress, Divider
} from '@mui/material';
import { IRole, IPermission } from '../../types';
import { fetchRolesAndPermissions, fetchAllPermissions, updatePermissionsForRole } from '../../services/roleService';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

type IPermissionWithCategory = IPermission & { category?: string | null };

const getRoleIcon = (roleName: string): JSX.Element => {
  const s = roleName.toLowerCase();
  if (s.includes('superuser')) return <SupervisorAccountIcon />;
  if (s.includes('admin')) return <AdminPanelSettingsIcon />;
  if (s.includes('toimisto')) return <BusinessCenterIcon />;
  return <VpnKeyIcon />;
};

const splitPermissionName = (permissionName: string) => {
  const [resource, ...rest] = permissionName.split('_');
  return { resource, action: rest.join('_') };
};

const humanize = (s: string) =>
  s.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));

interface RolesAndPermissionsTabProps {
  setFeedback: (feedback: { type: AlertColor; message: string } | null) => void;
}


// Normalizes raw category strings to a stable key used for lookups/sorting.
// Example: "App Settings" -> "app_settings"
const normalizeCat = (s: string) => s.replace(/\s+/g, '_').toLowerCase();

// Exact desired order of categories (from highest to lowest priority).
const CATEGORY_ORDER = ['office', 'arrangement', 'control', 'app_settings'] as const;

// Precomputed rank map for O(1) priority lookups in the comparator.
const CATEGORY_RANK: Record<string, number> = {
  office: 0,
  arrangement: 1,
  control: 2,
  app_settings: 3,
};

// Comparator for category keys:
// 1) Sort by the custom order defined above (using CATEGORY_RANK)
// 2) If a category is not listed, push it to the end (max rank)
// 3) For ties/unknowns, fall back to locale-aware alphabetical order
const byCategoryOrder = (a: string, b: string) => {
  const ra = CATEGORY_RANK[normalizeCat(a)];
  const rb = CATEGORY_RANK[normalizeCat(b)];
  const ar = ra === undefined ? Number.MAX_SAFE_INTEGER : ra;
  const br = rb === undefined ? Number.MAX_SAFE_INTEGER : rb;
  return ar - br || a.localeCompare(b, 'fi');
};

const RolesAndPermissionsTab: React.FC<RolesAndPermissionsTabProps> = ({ setFeedback }) => {
  const [roles, setRoles] = useState<IRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<IPermissionWithCategory[]>([]);
  const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        fetchRolesAndPermissions(),
        fetchAllPermissions(),
      ]);
      setRoles(rolesData);
      setAllPermissions(permissionsData as IPermissionWithCategory[]);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load roles and permissions.' });
    } finally {
      setIsLoading(false);
    }
  }, [setFeedback]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (selectedRole) setSelectedPermissionIds(new Set(selectedRole.permissionIds || []));
    else setSelectedPermissionIds(new Set());
  }, [selectedRole]);

  // category -> resource -> [permissions]
  const groupedByCategory = useMemo(() => {
    const out: Record<string, Record<string, IPermissionWithCategory[]>> = {};
    for (const p of allPermissions) {
      const { resource } = splitPermissionName(p.permissionName);
      // Use normalized category key so sorting works consistently
      const cat = normalizeCat(p.category ?? 'other');
      (out[cat] ||= {});
      (out[cat][resource] ||= []).push(p);
    }

    // Sort categories/resources. Categories use the custom order above.
    const sorted: typeof out = {};
    Object.keys(out)
      .sort(byCategoryOrder) // <-- custom category order applied here
      .forEach(cat => {
        const resMap = out[cat];
        const sortedRes: Record<string, IPermissionWithCategory[]> = {};
        Object.keys(resMap)
          .sort((a, b) => a.localeCompare(b, 'fi'))
          .forEach(r => {
            sortedRes[r] = [...resMap[r]].sort((a, b) =>
              a.permissionName.localeCompare(b.permissionName, 'fi')
            );
          });
        sorted[cat] = sortedRes;
      });

    return sorted;
  }, [allPermissions]);

  const handleRoleSelect = (role: IRole) => setSelectedRole(role);

  const handlePermissionChange = (permissionId: number, isChecked: boolean) => {
    setSelectedPermissionIds(prev => {
      const s = new Set(prev);
      if (isChecked) s.add(permissionId); else s.delete(permissionId);
      return s;
    });
  };

  const handleResourceToggle = (category: string, resource: string, isChecked: boolean) => {
    const ids = (groupedByCategory[category]?.[resource] || []).map(p => p.permissionId);
    setSelectedPermissionIds(prev => {
      const s = new Set(prev);
      ids.forEach(id => isChecked ? s.add(id) : s.delete(id));
      return s;
    });
  };

  const handleCategoryToggle = (category: string, isChecked: boolean) => {
    const ids = Object.values(groupedByCategory[category] || {}).flat().map(p => p.permissionId);
    setSelectedPermissionIds(prev => {
      const s = new Set(prev);
      ids.forEach(id => isChecked ? s.add(id) : s.delete(id));
      return s;
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await updatePermissionsForRole(selectedRole.rooliId, Array.from(selectedPermissionIds));
      setFeedback({ type: 'success', message: `Permissions for role "${selectedRole.roolinNimi}" updated successfully!` });
      const updatedRoles = await fetchRolesAndPermissions();
      setRoles(updatedRoles);
      const updated = updatedRoles.find(r => r.rooliId === selectedRole.rooliId);
      if (updated) setSelectedRole(updated);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Grid
      container
      spacing={4}
      sx={{
        flex: 1,
        height: { xs: 'auto' },
        overflowY: { xs: 'visible', md: 'auto' },
        minHeight: 0,
      }}
    >
      {/* Left rail (fixed width on md+) */}
      <Grid
        sx={{
          height: '100%',
          overflowY: 'auto',
          borderBottom: { xs: 1, md: 0 },
        }}
      >
        <Typography variant="h6" sx={{ pl: 2, pb: 1, pt: { xs: 1, md: 0 } }}>Roles</Typography>
        <List component="nav" dense>
          {roles.map(role => (
            <ListItemButton
              key={role.rooliId}
              selected={selectedRole?.rooliId === role.rooliId}
              onClick={() => handleRoleSelect(role)}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{getRoleIcon(role.roolinNimi)}</ListItemIcon>
              <ListItemText primary={role.roolinNimi} />
            </ListItemButton>
          ))}
        </List>
      </Grid>

      {/* Right content (fluid) */}
      <Grid
        sx={{
          borderLeft: { md: 1 },
          borderColor: 'divider',
          minWidth: 0,
          minHeight: 270,
          padding: 2,
          display: 'flex',
          flexDirection: 'column',
          height: { xs: 'auto', md: '100%' },
        }}
      >
        {selectedRole ? (
          <>
            <Box sx={{ px: { xs: 1.5, md: 2 }, pt: { xs: 1.5, md: 2 } }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Permissions for{' '}
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  {selectedRole.roolinNimi}
                </Box>
              </Typography>
            </Box>

            {/* scrollable content */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                px: { xs: 1.5, md: 2 },
                pb: 2,
                minWidth: 0,
                width: '100%',
              }}
            >
              {Object.entries(groupedByCategory).map(([category, resources]) => {
                const categoryIds = Object.values(resources).flat().map(p => p.permissionId);
                const catAll = categoryIds.length > 0 && categoryIds.every(id => selectedPermissionIds.has(id));
                const catSome = categoryIds.some(id => selectedPermissionIds.has(id)) && !catAll;

                return (
                  <Box key={category} sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={catAll}
                          indeterminate={catSome}
                          onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                          {humanize(category)}
                        </Typography>
                      }
                    />

                    <Grid container spacing={2}>
                      {Object.entries(resources).map(([resource, perms]) => {
                        const allSelected = perms.every(p => selectedPermissionIds.has(p.permissionId));
                        const someSelected = perms.some(p => selectedPermissionIds.has(p.permissionId)) && !allSelected;

                        return (
                          <Grid
                            key={`${category}-${resource}`}
                          >
                            <Card elevation={2} sx={{ height: '100%' }}>
                              <CardHeader
                                title={
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={allSelected}
                                        indeterminate={someSelected}
                                        onChange={(e) => handleResourceToggle(category, resource, e.target.checked)}
                                        size="small"
                                      />
                                    }
                                    label={
                                      <Typography variant="subtitle1" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                                        {humanize(resource === 'timber' ? 'Timber Stacks' : resource)}
                                      </Typography>
                                    }
                                  />
                                }
                                sx={{ bgcolor: 'action.hover', p: 1.5, borderBottom: 1, borderColor: 'divider' }}
                              />
                              <CardContent>
                                <FormGroup>
                                  {perms.map((p) => {
                                    const { resource: r, action } = splitPermissionName(p.permissionName);
                                    const label = humanize(action || p.permissionName.replace(`${r}_`, ''));
                                    return (
                                      <Tooltip key={p.permissionId} title={p.description || ''} placement="right">
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              checked={selectedPermissionIds.has(p.permissionId)}
                                              onChange={(e) => handlePermissionChange(p.permissionId, e.target.checked)}
                                              name={p.permissionName}
                                              size="small"
                                            />
                                          }
                                          label={<Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{label}</Typography>}
                                        />
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

                    <Divider sx={{ mt: 3 }} />
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ pt: 2, textAlign: 'right', px: { xs: 1.5, md: 2 } }}>
              <Button variant="contained" onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          </>
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 60, mb: 2, color: 'text.secondary' }} />
            <Typography variant="h6">Select a Role</Typography>
            <Typography color="text.secondary">Select a role from the list to manage its permissions.</Typography>
          </Stack>
        )}
      </Grid>
    </Grid>
  );
};

export default RolesAndPermissionsTab;
