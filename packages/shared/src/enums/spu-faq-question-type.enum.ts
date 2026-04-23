export const SpuFaqQuestionType = {
  RECOMMENDED_SELECTION: 'recommended_selection',
  INFORMATION_PROVIDING: 'information_providing',
  GENERAL_KNOWLEDGE: 'general_knowledge',
  PRODUCT_ADVANTAGES: 'product_advantages',
  FUNCTIONAL_PARAMETERS: 'functional_parameters',
  SOLUTION: 'solution',
  CONFIGURATION_INFO: 'configuration_info',
  PRODUCT_CUSTOMIZATION: 'product_customization',
  NO_MATCHING_PRODUCT: 'no_matching_product',
  NEW_DEVELOPMENT_SELECTION: 'new_development_selection',
  OPERATION_MAINTENANCE: 'operation_maintenance',
  OTHER: 'other',
} as const;

export type SpuFaqQuestionType = typeof SpuFaqQuestionType[keyof typeof SpuFaqQuestionType];
