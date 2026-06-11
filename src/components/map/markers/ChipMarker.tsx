// frontend/src/components/map/markers/ChipMarker.tsx
'use client';

import React from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import { Box, Typography, Divider } from '@mui/material';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { useLayout } from '../../../contexts/LayoutContext';

// Icons Import
import CategoryIcon from '@mui/icons-material/Category';
import GrainIcon from '@mui/icons-material/Grain';
import HubIcon from '@mui/icons-material/Hub';
import BusinessIcon from '@mui/icons-material/Business';

const ChipMarker = ({ marker }: { marker: any }) => {
    const { chipIcon, chipIconSize, chipPathOpacity } = useLayout();

    const originPos: [number, number] = [Number(marker.originLat), Number(marker.originLong)];
    const destPos: [number, number] = [Number(marker.destLat), Number(marker.destLong)];

    if (!marker.originLat || !marker.originLong || !marker.destLat || !marker.destLong) return null;

    const themeColor = marker.color || '#a38f6d';

    const getSelectedIcon = () => {
        const iconStyle = { color: 'white', fontSize: `${chipIconSize * 0.7}px` };
        switch (chipIcon) {
            case 'Grain': return <GrainIcon sx={iconStyle} />;
            case 'Hub': return <HubIcon sx={iconStyle} />;
            case 'Business': return <BusinessIcon sx={iconStyle} />;
            default: return <CategoryIcon sx={iconStyle} />;
        }
    };

    const createPointedIcon = (color: string, isOrigin: boolean) => {
        const iconHtml = renderToStaticMarkup(
            isOrigin ? getSelectedIcon() :
                <span style={{ color: color, fontWeight: 'bold', fontSize: `${chipIconSize * 0.45}px`, fontFamily: 'Arial', lineHeight: 1 }}>D</span>
        );

        // Calculate icon size for the inner container to be centered
        const innerIconSize = chipIconSize * 0.75;

        return L.divIcon({
            className: 'custom-pointed-marker',
            html: `
                <div style="
                    position: relative;
                    background-color: ${isOrigin ? color : 'white'};
                    width: ${chipIconSize}px;
                    height: ${chipIconSize}px;
                    border-radius: 50% 50% 0 50%;
                    transform: rotate(45deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid ${isOrigin ? 'white' : color};
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                ">
                    <div style="
                        transform: rotate(-45deg); 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        width: ${innerIconSize}px;
                        height: ${innerIconSize}px;
                    ">
                        ${iconHtml}
                    </div>
                </div>
            `,
            iconSize: [chipIconSize, chipIconSize],
            iconAnchor: [chipIconSize / 2, chipIconSize], // Point points exactly to the latlng
            popupAnchor: [0, -chipIconSize]
        });
    };

    return (
        <>
            <Marker
                key={`origin-${marker.id}-${chipIcon}-${chipIconSize}`}
                position={originPos}
                icon={createPointedIcon(themeColor, true)}
            >
                <Popup>
                    <Typography variant="subtitle2" fontWeight="bold">{marker.abbreviation}</Typography>
                    <Typography variant="body2">{marker.originName}</Typography>
                </Popup>
            </Marker>

            {/* <Marker
                key={`dest-${marker.id}-${chipIcon}-${chipIconSize}`}
                position={destPos}
                icon={createPointedIcon(themeColor, false)}
            >
                <Popup>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColor }}>{marker.abbreviation}</Typography>
                    <Typography variant="body2">{marker.destName}</Typography>
                </Popup>
            </Marker> */}

            <Polyline positions={[originPos, destPos]} pathOptions={{ color: themeColor, weight: 2, dashArray: '8, 12', opacity: chipPathOpacity }} />
        </>
    );
};

export default ChipMarker;