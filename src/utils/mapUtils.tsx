// frontend/src/utils/mapUtils.ts
'use client';
import L from 'leaflet';
import * as MuiIcons from '@mui/icons-material';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { IMapOtherMarker, IPuutavaraItem, IBackendPurkupaikka } from '@/types';
import { DropoffIconType, PuulaaniIconType } from '@/contexts/LayoutContext';


/*
 * Normalize a color string to a valid hex format accepted by CSS/SVG.
 * - Accepts values like "#a44c4c", "a44c4c", "#fff", or "#ffffffff".
 * - Falls back to a safe default if the input is empty/invalid.
 */

const normalizeColor = (c?: string | null, fallback = '#757575') => {
  const v = (c ?? '').trim();
  if (!v) return fallback;
  const hex = v.startsWith('#') ? v : `#${v}`;
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex) ? hex : fallback;
};

/**
 * Force color/stroke directly on the root <svg> element markup.
 * Some MUI icons ignore `color` when rendered to static markup,
 * so we inject style attributes to ensure the icon is actually colored.
 *
 * @param svgMarkup   Raw SVG string produced by renderToStaticMarkup(...)
 * @param fillColor   Fill/text color for the icon
 * @param strokeColor Stroke color for the icon outline
 * @param strokeWidthPx Stroke width in pixels
 * @returns Updated SVG markup with styles injected
 */

const forceSvgColor = (
  svgMarkup: string,
  fillColor: string,
  strokeColor = '#fff',
  strokeWidthPx = 0.8
) => {
  if (!svgMarkup.includes('<svg')) return svgMarkup;

  const inject = `color:${fillColor};fill:${fillColor};stroke:${strokeColor};stroke-width:${strokeWidthPx}px`;

   // If the <svg> already has a style attribute, append to it.
  if (/<svg[^>]*style="/i.test(svgMarkup)) {
    return svgMarkup.replace(
      /<svg([^>]*?)style="([^"]*)"/i,
      (_m, pre, styles) => `<svg${pre}style="${styles};${inject}"`
    );
  }
  // Otherwise add a new style attribute.
  return svgMarkup.replace(/<svg/i, `<svg style="${inject}"`);
};

/**
 * Timber stack (Puulaani) icon factory.
 * - Renders a chosen MUI icon as SVG
 * - Forces the client color inside the SVG (fill/stroke)
 * - Wraps it in a small container with a drop shadow for legibility
 *
 * @param color     Client color string (hex). If invalid, a safe fallback is used.
 * @param iconName  Which MUI icon to render for timber stacks.
 * @param iconSize  Icon pixel size (both width/height).
 * @returns Leaflet DivIcon ready to use in markers.
 */

export const getPuulaaniIcon = (color: string | null, iconName: PuulaaniIconType, iconSize: number): L.DivIcon => {
  const MIN_PUULAANI_SIZE = 28;
  const finalSize = Math.max(iconSize, MIN_PUULAANI_SIZE); // Use the larger of the two sizes
  const safeColor = normalizeColor(color);

  const icons: Record<PuulaaniIconType, React.ElementType> = {
    LocationOn: MuiIcons.LocationOn,
    Forest: MuiIcons.Forest,
    Room: MuiIcons.Room,
    FmdGood: MuiIcons.FmdGood,
    PinDrop: MuiIcons.PinDrop,
  };
  const Icon = icons[iconName] || MuiIcons.LocationOn;

  // Render MUI SVG to string and then enforce the color on the <svg>.
  const raw = renderToStaticMarkup(<Icon style={{ fontSize: iconSize }} />);
  const colored = forceSvgColor(raw, safeColor, '#fff', 0.9);

// Simple wrapper so anchoring and shadow look good on the map.
  const html = `
    <div style="
      width:${finalSize}px;
      height:${finalSize}px;
      display:grid;
      place-items:center;
      filter:drop-shadow(0 2px 4px rgba(0,0,0,.45)); 
      background:transparent;">
      ${colored}
    </div>
  `;

  return L.divIcon({
    className: 'custom-puulaani-icon',
    html,
    iconSize: [finalSize, finalSize],
    iconAnchor: [finalSize / 2, finalSize],   // bottom-center for MUI pin-like icons
    popupAnchor: [0, -finalSize],            // popup opens above the icon
  });
};


/**
 * Drop-off location (Purkupaikka) icon factory.
 * - Creates a speech-bubble style marker with a red ring
 * - Places a MUI icon inside; color is forced via SVG style injection
 * - Uses border-box + inner padding so the glyph never touches the ring
 *
 * @param iconName  Which MUI icon to use (Warehouse/Factory/…)
 * @param iconSize  Outer size of the bubble including ring/padding (px)
 * @returns Leaflet DivIcon ready to use in markers.
 */

export const purkupaikkaIcon = (iconName: DropoffIconType, iconSize: number): L.DivIcon => {
  const MIN_DROPOFF_SIZE = 20;
  const finalSize = Math.max(iconSize, MIN_DROPOFF_SIZE); // Use the larger size
  const ringColor = '#c62828';
  const backgroundColor = '#ffffff';
  const houseColor = '#c62828';      // inner element color

  const icons: Record<DropoffIconType, React.ElementType> = {
    Warehouse: MuiIcons.Warehouse,
    Factory: MuiIcons.Factory,
    LocalShipping: MuiIcons.LocalShipping,
    Business: MuiIcons.Business,
  };
  const Icon = icons[iconName] || MuiIcons.Warehouse;


  const ring = 2;
  // --- FIX 3: Calculate padding and inner size based on finalSize ---
  const pad  = Math.max(2, Math.round(finalSize * 0.1));
  const inner = Math.max(8, finalSize - 2 * (ring + pad));

  const raw = renderToStaticMarkup(React.createElement(Icon, { style: { fontSize: inner, transform: 'rotate(45deg)' } }));
  const coloredSvg = forceSvgColor(raw, houseColor, 'none', 0);

  const html = `
    <div style="
      width:${finalSize}px; height:${finalSize}px;
      box-sizing:border-box;
      padding:${pad}px;
      background:${backgroundColor};
      border:${ring}px solid ${ringColor};
      border-radius:50% 50% 50% 0; transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 5px rgba(0,0,0,0.4);
    ">
      ${coloredSvg}
    </div>
  `;

  return L.divIcon({
    className: 'custom-purkupaikka-icon',
    html,
    // --- FIX 4: Use finalSize for all dimensions ---
    iconSize: [finalSize, finalSize],
    iconAnchor: [finalSize / 2, finalSize], 
    popupAnchor: [0, -finalSize],
  });
};


// MuuMerkkiIcon (Other Marker) – white glyph inside, colored square background
export const getMuuMerkkiIcon = (marker: IMapOtherMarker, iconSize: number, color: string): L.DivIcon => {
  const MIN_OTHER_SIZE = 24;
  const finalSize = Math.max(iconSize, MIN_OTHER_SIZE);

  // Resolve the MUI icon component by name; fallback to a help icon
  let IconComponent: React.ElementType = MuiIcons.HelpOutline;
  if (marker.iconType && MuiIcons[marker.iconType as keyof typeof MuiIcons]) {
    IconComponent = MuiIcons[marker.iconType as keyof typeof MuiIcons];
  } else {
    console.warn(`MuuMerkki icon "${marker.iconType}" not found. Using fallback.`);
  }

  // Background (tile) color taken from marker; default to a neutral gray
  const bgColor = normalizeColor(marker.color ?? '#424242', '#424242');
  const innerIconSize = Math.round(finalSize * 0.65);
  const borderPx = 2;
  // // Sizes for the square badge and the glyph inside it
  // const BOX_SIZE = 34;           // total badge size (px), including border
  // const ICON_SIZE = 22;          // inner glyph size (px)
  // const BORDER_PX = 2;           // outer white border thickness
  // // const pad  = Math.max(2, Math.round(ICON_SIZE * 0.15));

  // Render the MUI icon to SVG markup and FORCE it to white
  const rawSvg = renderToStaticMarkup(
    React.createElement(IconComponent, { style: { fontSize: innerIconSize, color: 'white'} })
  );
  const whiteSvg = forceSvgColor(rawSvg, '#ffffff', '#ffffff', 0.6);

  // Square badge with rounded corners and a subtle shadow
  const html = `
    <div style="
      width:${finalSize}px; height:${finalSize}px;
      background:${bgColor};
      border-radius:8px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 5px rgba(0,0,0,0.4);
      border:${borderPx}px solid #ffffff;
      box-sizing: border-box;
    ">
      ${whiteSvg}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-muu-merkki-icon',
    iconSize: [finalSize, finalSize],
    iconAnchor: [finalSize / 2, finalSize],
    popupAnchor: [0, -finalSize],          // popup above the badge
  });
};

/*
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
*/


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