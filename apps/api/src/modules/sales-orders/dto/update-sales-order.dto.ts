import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  BlType,
  CustomsDeclarationMethod,
  DomesticTradeType,
  InvoiceType,
  OrderNature,
  PaymentTerm,
  PrimaryIndustry,
  ReceiptStatus,
  SalesOrderStatus,
  SalesOrderType,
  SecondaryIndustry,
  TradeTerm,
  TransportationMethod,
  YesNo,
} from '@infitek/shared';
import { CreateSalesOrderExpenseDto } from './create-sales-order-expense.dto';
import { CreateSalesOrderItemDto } from './create-sales-order-item.dto';

export class UpdateSalesOrderDto {
  @IsOptional()
  @IsIn(Object.values(DomesticTradeType))
  domesticTradeType?: DomesticTradeType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalOrderCode?: string;

  @IsOptional()
  @IsIn(Object.values(SalesOrderType))
  orderType?: SalesOrderType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  afterSalesSourceOrderId?: number;

  @IsOptional()
  @IsString()
  afterSalesProductSummary?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  destinationCountryId?: number;

  @IsOptional()
  @IsIn(Object.values(PaymentTerm))
  paymentTerm?: PaymentTerm;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shipmentOriginCountryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  signingCompanyId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salespersonId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  otherIndustryNote?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  currencyId?: number;

  @IsOptional()
  @IsIn(Object.values(TradeTerm))
  tradeTerm?: TradeTerm;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  destinationPortId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankAccount?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extraViewerId?: number;

  @IsOptional()
  @IsIn(Object.values(PrimaryIndustry))
  primaryIndustry?: PrimaryIndustry;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  exchangeRate?: number;

  @IsOptional()
  @IsIn(Object.values(TransportationMethod))
  transportationMethod?: TransportationMethod;

  @IsOptional()
  @IsDateString()
  crmSignedAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  contractAmount?: number;

  @IsOptional()
  @IsIn(Object.values(OrderNature))
  orderNature?: OrderNature;

  @IsOptional()
  @IsIn(Object.values(SecondaryIndustry))
  secondaryIndustry?: SecondaryIndustry;

  @IsOptional()
  @IsIn(Object.values(ReceiptStatus))
  receiptStatus?: ReceiptStatus;

  @IsOptional()
  @IsIn(Object.values(SalesOrderStatus))
  status?: SalesOrderStatus;

  @IsOptional()
  @IsArray()
  contractFileKeys?: string[];

  @IsOptional()
  @IsArray()
  contractFileNames?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  receivedAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  merchandiserId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  merchandiserAbbr?: string;

  @IsOptional()
  @IsDateString()
  requiredDeliveryAt?: string;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isSharedOrder?: YesNo;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isSinosure?: YesNo;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isPalletized?: YesNo;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  requiresCustomsCertificate?: YesNo;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isSplitInAdvance?: YesNo;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  usesMarketingFund?: YesNo;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  requiresExportCustoms?: YesNo;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  requiresWarrantyCard?: YesNo;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  requiresMaternityHandover?: YesNo;

  @IsOptional()
  @IsIn(Object.values(CustomsDeclarationMethod))
  customsDeclarationMethod?: CustomsDeclarationMethod;

  @IsOptional()
  @IsArray()
  plugPhotoKeys?: string[];

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isInsured?: YesNo;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  isAliTradeAssurance?: YesNo;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  aliTradeAssuranceOrderCode?: string;

  @IsOptional()
  @IsString()
  forwarderQuoteNote?: string;

  @IsOptional()
  @IsString()
  consigneeCompany?: string;

  @IsOptional()
  @IsString()
  consigneeOtherInfo?: string;

  @IsOptional()
  @IsString()
  notifyCompany?: string;

  @IsOptional()
  @IsString()
  notifyOtherInfo?: string;

  @IsOptional()
  @IsString()
  shipperCompany?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shipperOtherInfoCompanyId?: number;

  @IsOptional()
  @IsString()
  domesticCustomerCompany?: string;

  @IsOptional()
  @IsString()
  domesticCustomerDeliveryInfo?: string;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  usesDefaultShippingMark?: YesNo;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  shippingMarkNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  shippingMarkTemplateKey?: string;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  needsInvoice?: YesNo;

  @IsOptional()
  @IsIn(Object.values(InvoiceType))
  invoiceType?: InvoiceType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingDocumentsNote?: string;

  @IsOptional()
  @IsIn(Object.values(BlType))
  blType?: BlType;

  @IsOptional()
  @IsString()
  originalMailAddress?: string;

  @IsOptional()
  @IsString()
  businessRectificationNote?: string;

  @IsOptional()
  @IsString()
  customsDocumentNote?: string;

  @IsOptional()
  @IsString()
  otherRequirementNote?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemDto)
  items?: CreateSalesOrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderExpenseDto)
  expenses?: CreateSalesOrderExpenseDto[];
}
