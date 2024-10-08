import { z } from "zod";
import {
  recordsUnionDefaultSchema,
  RecordsUnionSchemaBase,
  RecordsUnionSchemaOptionsValue,
} from "./default-records-schema.js";
import {
  SupportedRecordTypes,
  supportedRecordTypesUnionSchema,
} from "./supported-record-types-schema.js";

export function extendDefaultRecordsUnionSchema<A extends RecordsAdditions>(
  additions?: A
) {
  return z.discriminatedUnion(
    recordsUnionDefaultSchema.discriminator,
    recordsUnionDefaultSchema.options.map((obj) =>
      obj.extend({
        ...(additions?.["global"] ?? {}),
        ...(additions?.[obj.shape.type.value] ?? {}),
      })
    ) as unknown as UnionOptionsSkeleton
  ) as RecordsUnionSchemaExtended<A>;
}

export const recordAdditionsSchema = z.record(
  z.union([z.literal("global"), ...supportedRecordTypesUnionSchema.options]),
  z.record(z.string(), z.instanceof(z.ZodType))
);

export type RecordsAdditions = z.infer<typeof recordAdditionsSchema>;

type UnionDiscriminator = typeof recordsUnionDefaultSchema.discriminator;
type UnionOptionsSkeleton = [
  z.ZodDiscriminatedUnionOption<UnionDiscriminator>,
  ...z.ZodDiscriminatedUnionOption<UnionDiscriminator>[],
];

type RecordMixedAdditions<
  A extends RecordsAdditions,
  T extends SupportedRecordTypes,
> = {
  [K in keyof A["global"]]: A["global"][K];
} & {
  [K in keyof A[T]]: A[T][K];
};

type RecordMixedAdditionsFiltered<
  A extends RecordsAdditions,
  T extends SupportedRecordTypes,
  C = RecordMixedAdditions<A, T>,
> = {
  [K in keyof C as C[K] extends z.ZodTypeAny
    ? K
    : never]: C[K] extends z.ZodTypeAny ? C[K] : never;
};

type RecordObjectSchemaShapeExtended<
  R extends RecordsUnionSchemaOptionsValue,
  A extends RecordsAdditions,
> = R["shape"] & RecordMixedAdditionsFiltered<A, R["shape"]["type"]["value"]>;

type RecordObjectSchemaExtended<
  R extends RecordsUnionSchemaOptionsValue,
  A extends RecordsAdditions,
> = z.ZodObject<RecordObjectSchemaShapeExtended<R, A>>;

type RecordsUnionSchemaOptionsExtended<
  R extends RecordsUnionSchemaOptionsValue[],
  A extends RecordsAdditions,
> = {
  [K in keyof R]: RecordObjectSchemaExtended<R[K], A>;
};

export type RecordsUnionSchemaExtended<
  A extends RecordsAdditions = {},
  U extends RecordsUnionSchemaBase = RecordsUnionSchemaBase,
> = z.ZodDiscriminatedUnion<
  UnionDiscriminator,
  RecordsUnionSchemaOptionsExtended<U["options"], A>
>;
