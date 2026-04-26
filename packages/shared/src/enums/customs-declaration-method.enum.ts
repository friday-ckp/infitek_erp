export const CustomsDeclarationMethod = {
  SELF: 'self',
  ALI_ONE_TOUCH: 'ali_one_touch',
} as const;

export type CustomsDeclarationMethod =
  (typeof CustomsDeclarationMethod)[keyof typeof CustomsDeclarationMethod];
