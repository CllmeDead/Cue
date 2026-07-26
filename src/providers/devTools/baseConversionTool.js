const BASES = {
    hex: { radix: 16, digits: /^[0-9a-f]+$/i, label: 'Hex' },
    bin: { radix: 2, digits: /^[01]+$/, label: 'Binary' },
    oct: { radix: 8, digits: /^[0-7]+$/, label: 'Octal' },
    dec: { radix: 10, digits: /^[0-9]+$/, label: 'Decimal' },
};
const PREFIX_TRIGGER = /^(hex|bin|oct|dec)\s+(\S+)$/i;
const LITERAL_TRIGGER = /^0([xXbBoO])([0-9a-fA-F]+)$/;
const LITERAL_RADIX = { x: 16, b: 2, o: 8 };

function buildResult(value, sourceLabel) {
    return {
        id: 'devtool-base-conversion',
        kind: 'devtool',
        title: `${value.toString(10)}`,
        subtitle: `${sourceLabel} - Enter to copy decimal`,
        copyValue: value.toString(10),
        preview: [
            `Decimal: ${value.toString(10)}`,
            `Hex: 0x${value.toString(16)}`,
            `Binary: 0b${value.toString(2)}`,
            `Octal:0o${value.toString(8)}`,
        ].join('\n'),
    };
}
export function baseConversionTool(query) {
    const trimmed = query.trim();
    const literalMatch = trimmed.match(LITERAL_TRIGGER);
    if (literalMatch) {
        const radix = LITERAL_RADIX[literalMatch[1].toLowerCase()];
        const digits = literalMatch[2];
        const valid = radix === 16 ? /^[0-9a-f]+$/i : radix === 2 ? /^[01]+$/ : /^[0-7]+$/;
        if (valid.test(digits)) {
            const value = parseInt(digits, radix);
            if (!Number.isNaN(value)) return buildResult(value, `Parsed as ${trimmed}`);
        }
        return null;
    }
    const prefixMatch = trimmed.match(PREFIX_TRIGGER);
    if (prefixMatch) {
        const baseKey = prefixMatch[1].toLowerCase();
        const digits = prefixMatch[2];
        const base = BASES[baseKey];
        if (!base.digits.test(digits)) return null;
        const value = parseInt(digits, base.radix);
        if (Number.isNaN(value)) return null;
        return buildResult(value, `${base.label} ${digits}`);
    }
    return null;
}
