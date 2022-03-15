import { Metadata, Step, ParseResult, ShoppingList, ShoppingListItem, ImageURLOptions } from './types';
import { tokens, shoppingListToken, comment, blockComment } from './tokens';

function parseQuantity(quantity?: string, defaultText?: string): string | number | undefined {
    if (!quantity || quantity.trim() == '') {
        if (defaultText) return defaultText;
        return undefined;
    }

    quantity = quantity.trim();

    const [left, right] = quantity.split('/');

    const [numLeft, numRight] = [Number(left), Number(right)];

    if (!isNaN(numLeft) && !numRight) return numLeft;
    else if (!isNaN(numLeft) && !isNaN(numRight) && !(left.startsWith('0') || right.startsWith('0'))) return numLeft / numRight;

    return quantity.trim();
}

function parseUnits(units?: string): string | undefined {
    if (!units) return undefined;
    return units.trim();
}

function parseShoppingListItems(items: string): Array<ShoppingListItem> {
    const list = [];

    for (let item of items.split('\n')) {
        item = item.trim();

        if (item == '') continue;

        const [name, synonym] = item.split('|');

        list.push({
            name: name.trim(),
            synonym: synonym?.trim() || '',
        })
    }

    return list;
}

/**
 * Creates a URL for an image of the the supplied recipe.
 * 
 * @example
 * ```typescript
 * getImageURL('Baked Potato', { extension: 'jpg', step: 2 });
 * // returns "Baked Potato.2.jpg"
 * ```
 * 
 * @param name Name of the .cook file.
 * @param options The URL options.
 * @returns The image URL for the givin recipe and step.
 * 
 * @see {@link https://cooklang.org/docs/spec/#adding-pictures|Cooklang Pictures Specification}
 */
export function getImageURL(name: string, options?: ImageURLOptions) {
    options ??= {};
    return name + (options.step ? '.' + options.step : '') + '.' + (options.extension || 'png');
}

/**
 * Parses a Cooklang string and returns any metadata, steps, or shopping lists.
 * 
 * @param source A Cooklang string.
 * @returns The extracted metadata, steps, and shopping lists.
 * 
 * @see {@link https://cooklang.org/docs/spec/#the-cook-recipe-specification|Cooklang Recipe Specification}
 */
export function parse(source: string): ParseResult {
    const metadata: Metadata = {};
    const steps: Array<Step> = [];
    const shoppingList: ShoppingList = {};

    // Comments
    source = source
        .replace(comment, '')
        .replace(blockComment, ' ');

    // Parse shopping lists
    for (let match of source.matchAll(shoppingListToken)) {
        const groups = match.groups;
        if (!groups) continue;

        shoppingList[groups.name] = parseShoppingListItems(groups.items || '');

        // Remove it from the source
        source = source.substring(0, match.index || 0); + source.substring((match.index || 0) + match[0].length);
    }

    const lines = source
        .split('\n')
        .filter(l => l.trim().length > 0);

    for (let line of lines) {

        const step: Step = [];

        let pos = 0;
        for (let match of line.matchAll(tokens)) {
            const groups = match.groups;
            if (!groups) continue;

            // text
            if (pos < (match.index || 0)) {
                step.push({
                    type: 'text',
                    value: line.substring(pos, match.index),
                })
            }

            // metadata
            if (groups.key && groups.value) {
                metadata[groups.key.trim()] = groups.value.trim();
            }

            // single word ingredient
            if (groups.sIngredientName) {
                step.push({
                    type: 'ingredient',
                    name: groups.sIngredientName,
                    quantity: 'some',
                })
            }

            // multiword ingredient
            if (groups.mIngredientName) {
                step.push({
                    type: 'ingredient',
                    name: groups.mIngredientName,
                    quantity: parseQuantity(groups.mIngredientQuantity, 'some'),
                    units: parseUnits(groups.mIngredientUnits),
                })
            }

            // single word cookware
            if (groups.sCookwareName) {
                step.push({
                    type: 'cookware',
                    name: groups.sCookwareName,
                })
            }

            // multiword cookware
            if (groups.mCookwareName) {
                step.push({
                    type: 'cookware',
                    name: groups.mCookwareName,
                    quantity: parseQuantity(groups.mCookwareQuantity),
                })
            }

            // timer
            if (groups.timerQuantity) {
                step.push({
                    type: 'timer',
                    name: groups.timerName,
                    quantity: parseQuantity(groups.timerQuantity),
                    units: parseUnits(groups.timerUnits),
                })
            }

            pos = (match.index || 0) + match[0].length;
        }

        // If the entire line hasn't been parsed yet
        if (pos < line.length) {
            // Add the rest as a text item
            step.push({
                type: 'text',
                value: line.substring(pos),
            })
        }

        if (step.length > 0) steps.push(step);
    }

    return { metadata, steps, shoppingList };
}

export class Recipe {
    metadata: Metadata = {};
    steps: Array<Step> = [];
    shoppingList: ShoppingList = {};

    /**
     * Creates a new recipe from the supplied Cooklang string.
     * 
     * @param source The Cooklang string to parse. If `source` is ommited, an empty recipe is created.
     * 
     * @see {@link https://cooklang.org/docs/spec/#the-cook-recipe-specification|Cooklang Recipe Specification}
     */
    constructor(source?: string) {
        if (source) {
            Object.assign(this, parse(source));
        }
    }

    /**
     * Generates a Cooklang string from the recipes metadata, steps, and shopping lists.
     * __NOTE: Any comments will be lost.__
     * 
     * @returns The generated Cooklang string.
     */
    toCooklang(): string {
        let metadataStr = '';
        let stepStrs = [];
        let shoppingListStrs = [];

        for (let [key, value] of Object.entries(this.metadata)) {
            metadataStr += `>> ${key}: ${value}\n`;
        }

        for (let step of this.steps) {
            let stepStr = '';

            for (let item of step) {
                if ('value' in item) {
                    stepStr += item.value;
                } else {
                    if (item.type == 'ingredient') stepStr += '@';
                    else if (item.type == 'cookware') stepStr += '#';
                    else stepStr += '~';

                    stepStr += item.name;

                    stepStr += '{';
                    if (item.quantity) stepStr += item.quantity;
                    if ('units' in item && item.units) stepStr += '%' + item.units;
                    stepStr += '}';
                }
            }

            stepStrs.push(stepStr);
        }

        for (let [category, items] of Object.entries(this.shoppingList)) {
            let shoppingListStr = '';

            shoppingListStr += category + '\n';
            shoppingListStr += items.map(x => x.name + (x.synonym ? '|' + x.synonym : '')).join('\n');

            shoppingListStrs.push(shoppingListStr);
        }

        return [metadataStr, stepStrs.join('\n\n'), shoppingListStrs.join('\n\n')].join('\n');
    }

    toJSON(): string {
        return JSON.stringify({ metadata: this.metadata, steps: this.steps });
    }
}

export * from './types';