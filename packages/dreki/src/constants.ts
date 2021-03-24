/**
 * Constants
 */
export const MAX_ENTITY_CAPACITY = 1_000_000;
export const DEFAULT_ENTITY_CAPACITY = 10_000;
export const INITIAL_COMPONENT_SPARSE_SETS_COUNT = 32;

/**
 * Symbols
 */
export const SYMBOL_PREFIX = `$$__dreki__`;
export const RUNTIME_GLOBAL_KEY = Symbol(`${SYMBOL_PREFIX}runtime`);
export const COMPONENT_ID_PROP_KEY = Symbol(`${SYMBOL_PREFIX}component_id`);
export const GROUP_INFO_PROP_KEY = Symbol(`${SYMBOL_PREFIX}group_info`);
