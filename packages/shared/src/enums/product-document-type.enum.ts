export const ProductDocumentType = {
  BROCHURE: 'brochure',
  SPEC_SHEET: 'spec_sheet',
  CERTIFICATE: 'certificate',
  IMAGE: 'image',
  VIDEO: 'video',
  CUSTOMS_DOCS: 'customs_docs',
  QUOTATION: 'quotation',
  OTHER: 'other',
} as const;
export type ProductDocumentType = typeof ProductDocumentType[keyof typeof ProductDocumentType];
