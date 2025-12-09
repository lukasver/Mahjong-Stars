import '@prisma/client/runtime/library';

/** Temp workaround for 
./common/schemas/generated/index.ts:56:14
Type error: Type 'ZodObject<{ d: ZodArray<ZodNumber, "many">; e: ZodNumber; s: ZodNumber; toFixed: ZodAny; }, "strip", ZodTypeAny, { d: number[]; e: number; s: number; toFixed?: any; }, { ...; }>' is not assignable to type 'ZodType<DecimalJsLike, ZodTypeDef, DecimalJsLike>'.
  Types of property '_type' are incompatible.
    Type '{ d: number[]; e: number; s: number; toFixed?: any; }' is not assignable to type 'DecimalJsLike'.
      Property 'toFixed' is optional in type '{ d: number[]; e: number; s: number; toFixed?: any; }' but required in type 'DecimalJsLike'.
*/
declare module '@prisma/client/runtime/library' {
  // Allow the generator’s optional toFixed
  export interface DecimalJsLike {
    toFixed?: unknown;
  }
}
