import { u32 } from "@dreki.land/shared";

/**
 * general
 */
export const MAX_ENTITY_CAPACITY = 1_000_000;
export const DEFAULT_ENTITY_CAPACITY = 10_000;
export const INITIAL_COMPONENT_SPARSE_SETS_COUNT = 32;

export const MAX_SYSTEMS_PER_STAGE = u32.MAX / 8;
export const MAX_CHANGE_TICK_DELTA = (u32.MAX / 4) * 3;

/**
 * symbols
 */
export const SYMBOL_PREFIX = `$$__dreki__`;
export const COMPONENT_ID_PROP_KEY = Symbol(`${SYMBOL_PREFIX}component_id`);
export const GROUP_INFO_PROP_KEY = Symbol(`${SYMBOL_PREFIX}group_info`);
