import { Type } from 'class-transformer';
import {
  IsDateString,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  BlType,
  CustomsDeclarationMethod,
  InvoiceType,
  OrderNature,
  PaymentTerm,
  PrimaryIndustry,
  ReceiptStatus,
  SecondaryIndustry,
  ShippingDemandStatus,
  TradeTerm,
  TransportationMethod,
  YesNo,
} from '@infitek/shared';

export class UpdateShippingDemandDto {
  @IsOptional()
  @IsString()
  afterSalesProductSummary?: string | null;

  @IsOptional()
  @IsIn(Object.values(TradeTerm))
  tradeTerm?: TradeTerm | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankAccount?: string | null;

  @IsOptional()
  @IsIn(Object.values(PrimaryIndustry))
  primaryIndustry?: PrimaryIndustry | null;

  @IsOptional()
  @IsIn(Object.values(SecondaryIndustry))
  secondaryIndustry?: SecondaryIndustry | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  exchangeRate?: number | null;

  @IsOptional()
  @IsDateString()
  crmSignedAt?: string | null;

  @IsOptional()
  @IsIn(Object.values(PaymentTerm))
  paymentTerm?: PaymentTerm | null;

  @IsOptional()
  @IsIn(Object.values(OrderNature))
  orderNature?: OrderNature | null;

  @IsOptional()
  @IsIn(Object.values(ReceiptStatus))
  receiptStatus?: ReceiptStatus | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  merchandiserAbbr?: string | null;

  @IsOptional()
  @IsIn(Object.values(TransportationMethod))
  transportationMethod?: TransportationMethod | null;

  @IsOptional()
  @IsDateString()
  requiredDeliveryAt?: string | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isSharedOrder?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isSinosure?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isAliTradeAssurance?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isInsured?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isPalletized?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isSplitInAdvance?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  requiresExportCustoms?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  requiresWarrantyCard?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  requiresCustomsCertificate?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  requiresMaternityHandover?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(CustomsDeclarationMethod))
  customsDeclarationMethod?: CustomsDeclarationMethod | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  usesMarketingFund?: YesNo | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  aliTradeAssuranceOrderCode?: string | null;

  @IsOptional()
  @IsString()
  forwarderQuoteNote?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contractFileKeys?: string[] | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contractFileNames?: string[] | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plugPhotoKeys?: string[] | null;

  @IsOptional()
  @IsString()
  consigneeCompany?: string | null;

  @IsOptional()
  @IsString()
  consigneeOtherInfo?: string | null;

  @IsOptional()
  @IsString()
  notifyCompany?: string | null;

  @IsOptional()
  @IsString()
  notifyOtherInfo?: string | null;

  @IsOptional()
  @IsString()
  shipperCompany?: string | null;

  @IsOptional()
  @IsString()
  domesticCustomerCompany?: string | null;

  @IsOptional()
  @IsString()
  domesticCustomerDeliveryInfo?: string | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  usesDefaultShippingMark?: YesNo | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  shippingMarkNote?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  shippingMarkTemplateKey?: string | null;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  needsInvoice?: YesNo | null;

  @IsOptional()
  @IsIn(Object.values(InvoiceType))
  invoiceType?: InvoiceType | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingDocumentsNote?: string | null;

  @IsOptional()
  @IsIn(Object.values(BlType))
  blType?: BlType | null;

  @IsOptional()
  @IsString()
  originalMailAddress?: string | null;

  @IsOptional()
  @IsString()
  businessRectificationNote?: string | null;

  @IsOptional()
  @IsString()
  customsDocumentNote?: string | null;

  @IsOptional()
  @IsString()
  otherRequirementNote?: string | null;

  @IsOptional()
  @IsIn(Object.values(ShippingDemandStatus))
  status?: ShippingDemandStatus;
}
