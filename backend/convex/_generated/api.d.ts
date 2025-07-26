/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as messages_mutation from "../messages/mutation.js";
import type * as messages_query from "../messages/query.js";
import type * as rooms_mutation from "../rooms/mutation.js";
import type * as rooms_query from "../rooms/query.js";
import type * as users_mutation from "../users/mutation.js";
import type * as users_query from "../users/query.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "messages/mutation": typeof messages_mutation;
  "messages/query": typeof messages_query;
  "rooms/mutation": typeof rooms_mutation;
  "rooms/query": typeof rooms_query;
  "users/mutation": typeof users_mutation;
  "users/query": typeof users_query;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
