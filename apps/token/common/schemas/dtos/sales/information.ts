import z from 'zod';

const SaleInformationItemBase = z.object({
  value: z.string(),
  label: z.string(),
  props: z.record(z.string(), z.unknown()).optional(),
});

export const SaleInformationItem = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('textarea'),
    value: z.string(),
    label: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('text'),
    value: z.string(),
    label: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('file'),
    value: z.instanceof(File).or(z.string()),
    label: z.string(),
    props: z
      .object({
        isBanner: z.boolean().optional(),
        isTokenImage: z.boolean().optional(),
      })
      .optional(),
  }),
]);

export type SaleInformationItem = z.infer<typeof SaleInformationItem>;

export const InformationSchema = z.object({
  information: z.array(SaleInformationItem),
});

export const InformationSchemaAsStrings = z.object({
  information: z.array(
    SaleInformationItemBase.extend({
      type: z.union([
        z.literal('textarea'),
        z.literal('text'),
        z.literal('file'),
      ]),
    })
  ),
});

export type InformationSchemaAsStrings = z.infer<
  typeof InformationSchemaAsStrings
>;
