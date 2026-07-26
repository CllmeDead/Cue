import { uuidTool } from './devTools/uuidTool.js';
import { base64Tool } from './devTools/base64Tool.js';
import { jsonTool } from './devTools/jsonTool.js';
import { timestampTool } from './devTools/timestampTool.js';
import { baseConversionTool } from './devTools/baseConversionTool.js';
import { caseConvertTool } from './devTools/caseConvertTool.js';
import { colorConvertTool } from './devTools/colorConvertTool.js';
import { regexTestTool } from './devTools/regexTestTool.js';
import { wordCountTool } from './devTools/wordCountTool.js';
import { loremIpsumTool } from './devTools/loremIpsumTool.js';

const TOOLS = [uuidTool, base64Tool, jsonTool, timestampTool, baseConversionTool, caseConvertTool, colorConvertTool, regexTestTool, wordCountTool, loremIpsumTool,];
export function runDevTools(query) {
    for (const tool of TOOLS) {
        const result = tool(query);
        if (result) return Array.isArray(result) ? result : [result];
    }
    return [];
}