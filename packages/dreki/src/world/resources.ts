import type { record, Type } from "@dreki.land/shared";
import { OmitTupleIfSingleInstanceTypes } from "@dreki.land/shared";
import { RESOURCE_ID_PROP_KEY } from "../constants";
import { Runtime } from "./runtime";

export type Resource<T extends record = record> = Type<T> & { [RESOURCE_ID_PROP_KEY]?: ResourceId };

export type ResourceId = number;

export type ResourceInstance<T extends record = record> = InstanceType<Resource<T>>;
