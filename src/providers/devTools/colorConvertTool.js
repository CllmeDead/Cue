const HEX_TRIGGER = /^color\s+#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_TRIGGER = /^color\s+rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i;
const HSL_TRIGGER = /^color\s+hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+\s*)?\)$/i;

function expandShortHex(hex) {
    return hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
}
function hexToRgb(hex) {
    const full = expandShortHex(hex);
    return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16),
    };
}
function rgbToHex({ r, g, b }) {
    return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}
function rgbToHsl({ r, g, b }) {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
    const delta = max - min;
    const s = delta / (1 - Math.abs(2 * l - 1));
    let h;
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn-rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
    if (h < 0) h += 360;
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hslToRgb({ h, s, l }) {
    const sn = s / 100, ln = l /100;
    const c = (1 - Math.abs(2 * ln - 1)) * sn;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = ln - c / 2;
    let rp, gp, bp;
    if (h < 60) [rp, gp, bp] = [c, x, 0];
    else if (h < 120) [rp, gp, bp] = [x, c, 0];
    else if (h < 180) [rp, gp, bp] = [0, c, x];
    else if (h < 240) [rp, gp, bp] = [0, x, c];
    else if (h < 300) [rp, gp, bp] = [x, 0, c];
    else [rp, gp, bp] = [c, 0, x];
    return {
        r: Math.round((rp + m) * 255),
        g: Math.round((gp + m) * 255),
        b: Math.round((bp + m) * 255),
    };
}
function buildResults(rgb) {
    const hex = rgbToHex(rgb);
    const hsl = rgbToHsl(rgb);
    const formats = [
        { label: 'Hex', value: hex },
        { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
        { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    ];
    return formats.map((f, i) => ({
        id: `devtool-color-4${i}`,
        kind: 'devtool',
        title: f.value,
        subtitle: `${f.label} - Enter to copy`,
        copyValue: f.value,
        accentColor: hex,
    }));
}
export function colorConvertTool(query) {
    const hexMatch = query.match(HEX_TRIGGER);
    if (hexMatch) return buildResults(hexToRgb(hexMatch[1]));
    const rgbMatch = query.match(RGB_TRIGGER);
    if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        if (r > 255 || g > 255 || b > 255) return null;
        return buildResults({ r, g, b });
    }
    const hslMatch = query.match(HSL_TRIGGER);
    if(hslMatch) {
        const [h, s, l] = hslMatch.slice(1).map(Number);
        if (s > 100 || l > 100) return null;
        return buildResults(hslToRgb({ h, s, l }));
    }
    return null;
}