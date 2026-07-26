import { create, all } from 'mathjs';
const math = create(all, {});
const TEMP_SHORTHAND = /^(-?\d+(?:\.\d+)?)\s*(f|fahrenheit|c|celsius)\s*(?:to|in)\s*(f|fahrenheit|c|celsius)$/i;

function expandTemperatureShorthand(query) {
    const match = query.match(TEMP_SHORTHAND);
    if (!match) return query;
    const [, amount, fromUnit, toUnit] = match;
    const normalize = (u) => (/^f/i.test(u) ? 'degF' : 'degC');
    return `${amount} ${normalize(fromUnit)} to ${normalize(toUnit)}`;
}
const BARE_NUMBER = /^-?\d+(\.\d+)?$/;
export function evaluateMathQuery(rawQuery) {
    const query = rawQuery.trim();
    if (!query || BARE_NUMBER.test(query)) return null;
    const expanded = expandTemperatureShorthand(query);
    let result;
    try {
        result = math.evaluate(expanded);
    } catch {
        return null;
    }
    if (result === undefined || typeof result === 'function') return null;
    let formatted;
    try {
        formatted = math.format(result, { precision: 6 });
    } catch {
        formatted = String(result);
    }
    return {
        id: 'math-result',
        kind: 'math',
        title: formatted,
        subtitle: query,
        copyValue: formatted,
    };
}