import type { record, Type } from "@dreki.land/shared";

export type Resource<T extends record = record> = Type<T>;

export type ResourceInstance<T extends record = record> = InstanceType<Resource<T>>;
