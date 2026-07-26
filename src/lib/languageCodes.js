export const LANGUAGE_CODES = {
    english: 'en', en: 'en',
    spanish: 'es', es: 'es',
    french: 'fr', fr: 'fr',
    german: 'de', de: 'de',
    italian: 'it', it: 'it',
    portugese: 'pt', pt: 'pt',
    dutch: 'nl', nl: 'nl',
    russian: 'ru', ru: 'ru',
    japanese: 'ja', ja: 'ja',
    korean: 'ko', ko: 'ko',
    chinese: 'zh', zh: 'zh', mandarin: 'zh',
    hindi: 'hi', hi: 'hi',
    arabic: 'ar', ar: 'ar',
    bengali: 'bn', bn: 'bn',
    turkish: 'tr', tr: 'tr',
    vietnamese: 'vi', vi: 'vi',
    polish: 'pl', pl: 'pl',
    swedish: 'sv', sv: 'sv',
    greek: 'el', el: 'el',
    hebrew: 'he', he: 'he',
    thai: 'th', th: 'th',
    indonesian: 'id', id: 'id',
    ukrainian: 'uk', uk: 'uk',
};
export function resolveLanguageCode(input) {
    return LANGUAGE_CODES[input.trim().toLowerCase()] ?? null;
}