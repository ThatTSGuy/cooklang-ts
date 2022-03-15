/**
 * A parsed ingredient node
 * 
 * @see {@link https://cooklang.org/docs/spec/#ingredients|Cooklang Ingredient Specification}
 */
export interface StepIngredient {
    type: 'ingredient';
    name: string;
    quantity?: string | number;
    units?: string;
}

/**
 * A parsed cookware node
 * 
 * @see {@link https://cooklang.org/docs/spec/#cookware|Cooklang Cookware Specification}
 */
export interface StepCookware {
    type: 'cookware';
    name: string;
    quantity?: string | number;
}

/**
 * A parsed timer node
 * 
 * @see {@link https://cooklang.org/docs/spec/#timer|Cooklang Timer Specification}
 */
export interface StepTimer {
    type: 'timer';
    name?: string;
    quantity?: string | number;
    units?: string;
}

/**
 * A parsed node of text
 */
export interface StepText {
    type: 'text';
    value: string;
}

export interface ShoppingListItem {
    name: string;
    synonym?: string;
}

/**
 * A array of parsed nodes
 */
export type Step = Array<StepIngredient | StepCookware | StepTimer | StepText>;

/**
 * A record of metadata keys and their values
 * 
 * @see {@link https://cooklang.org/docs/spec/#metadata|Cooklang Metadata Specification}
 */
export type Metadata = { [key: string]: string };

/**
 * A record of categories and their items
 * 
 * @see {@link https://cooklang.org/docs/spec/#the-shopping-list-specification|Cooklang Shopping List Specification}
 */
export type ShoppingList = { [key: string]: Array<ShoppingListItem> };

export interface ParseResult {
    metadata: Metadata;
    steps: Array<Step>;
    shoppingList: ShoppingList;
}

export interface ImageURLOptions {
    step?: number;
    extension?: 'png' | 'jpg';
}