// frontend/src/utils/mapUtils.ts
'use client';

import L from 'leaflet';
import * as MuiIcons from '@mui/icons-material';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { IMapOtherMarker, IPuutavaraItem, IBackendPurkupaikka } from '@/types';
import { DropoffIconType, PuulaaniIconType } from '@/contexts/LayoutContext';

// --- UPDATED: getPuulaaniIcon now accepts icon name and size ---
export const getPuulaaniIcon = (color: string | null, iconName: PuulaaniIconType, iconSize: number): L.DivIcon => {
    const safeColor = color && /^#([0-9A-Fa-f]{3,8})$/i.test(color.trim()) ? color.trim() : '#757575';
    
    // --- CORRECTION: Ensure all icons are correctly mapped from MuiIcons ---
    const icons: { [key in PuulaaniIconType]: React.ElementType } = {
        LocationOn: MuiIcons.LocationOn,
        Forest: MuiIcons.Forest,
        Room: MuiIcons.Room,
        FmdGood: MuiIcons.FmdGood,
        PinDrop: MuiIcons.PinDrop,
    };
    const IconComponent = icons[iconName] || MuiIcons.LocationOn;
    
    const html = renderToStaticMarkup(
        React.createElement(IconComponent, {
            style: {
                fontSize: `${iconSize}px`,
                color: safeColor,
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))',
                stroke: 'white',
                strokeWidth: 0.5,
            }
        })
    );
    return L.divIcon({
        className: 'custom-puulaani-icon',
        html: html,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize],
        popupAnchor: [0, -iconSize],
    });
};

// Purkupaikka Icon
export const purkupaikkaIcon = (iconName: DropoffIconType, iconSize: number): L.DivIcon => {
    const iconColor = '#ff0303ff';
    const backgroundColor = '#fdfdfd42';

    const icons: { [key in DropoffIconType]: React.ElementType } = {
        Warehouse: MuiIcons.Warehouse,
        Factory: MuiIcons.Factory,
        LocalShipping: MuiIcons.LocalShipping,
        Business: MuiIcons.Business,
    };
    const IconComponent = icons[iconName] || MuiIcons.Warehouse;

    // Adjust padding based on icon size for better centering
    const innerIconSize = Math.floor(iconSize * 0.6);

    const html = renderToStaticMarkup(
        React.createElement('div', {
            style: {
                width: `${iconSize}px`, height: `${iconSize}px`, backgroundColor: backgroundColor,
                borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.4)', border: `2px solid ${iconColor}`
            }
        }, React.createElement(IconComponent, {
            style: { fontSize: `${innerIconSize}px`, color: iconColor, transform: 'rotate(45deg)' }
        }))
    );
    const finalSize = iconSize + 4; // Add border size
    return L.divIcon({
        className: 'custom-purkupaikka-icon', html: html,
        iconSize: [finalSize, finalSize], 
        iconAnchor: [finalSize / 2, finalSize], 
        popupAnchor: [0, -finalSize],
    });
};


// MuuMerkkiIcon (Other Marker)
export const getMuuMerkkiIcon = (marker: IMapOtherMarker): L.DivIcon => {
    
    // Default fallback icon if the provided iconType is not found in MuiIcons
    let IconComponent: React.ElementType = MuiIcons.HelpOutline;

    // Dynamically and safely find the icon component from the MuiIcons library
    // This allows ANY valid Material Icon name to be used.
    if (marker.iconType && MuiIcons[marker.iconType as keyof typeof MuiIcons]) {
        IconComponent = MuiIcons[marker.iconType as keyof typeof MuiIcons];
    } else {
        console.warn(`MuuMerkki icon "${marker.iconType}" not found. Using fallback.`);
    }

    // Use the color from the marker data, with a safe default.
    const finalColor = marker.color || '#424242'; // Default to grey if no color is provided

    const html = renderToStaticMarkup(
      React.createElement('div', {
          style: {
              width: '32px',
              height: '32px',
              backgroundColor: finalColor,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
              border: '2px solid white',
          }
      }, React.createElement(IconComponent, {
          style: { fontSize: '22px', color: 'white' }
      }))
    );

    return L.divIcon({
      html,
      className: 'custom-muu-merkki-icon',
      iconSize: [36, 36], // icon size including border
      iconAnchor: [18, 36], // bottom center
      popupAnchor: [0, -36], // above the icon
    });
};

// --- General Map Utility Functions ---
export function entryAlreadyExists(
    list: { woodTypeId: number | null; dropoffLocationId: number | null; }[],
    woodTypeId: number | null,
    dropoffLocationId: number | null
): boolean {
    if (woodTypeId === null || dropoffLocationId === null) return false;
    return list.some(item =>
        item.woodTypeId === woodTypeId && item.dropoffLocationId === dropoffLocationId
    );
}

export const resolvePuutavaraName = (
    item: { woodTypeId: number | null; woodTypeName?: string | null; },
    puutavaratList: IPuutavaraItem[]
): string => {
    return puutavaratList.find(p => p.puutavaraNro === item.woodTypeId)?.puutavara || item.woodTypeName || 'Unknown Wood Type';
};

export const resolvePurkupaikkaName = (
    item: { dropoffLocationId: number | null; dropoffLocationName?: string | null; },
    purkupaikkaList: IBackendPurkupaikka[]
): string => {
    return purkupaikkaList.find(p => p.purkupaikkaId === item.dropoffLocationId)?.purkupaikka || item.dropoffLocationName || 'Unknown Drop-off Location';
};