import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ReceiptStatus,
  SalesOrderStatus,
  SalesOrderSource,
  SalesOrderType,
  YesNo,
} from '@infitek/shared';
import { FilesService } from '../../files/files.service';
import { CompaniesService } from '../master-data/companies/companies.service';
import { CountriesService } from '../master-data/countries/countries.service';
import { CurrenciesService } from '../master-data/currencies/currencies.service';
import { CustomersService } from '../master-data/customers/customers.service';
import { PortsService } from '../master-data/ports/ports.service';
import { SkusService } from '../master-data/skus/skus.service';
import { UsersService } from '../users/users.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { QuerySalesOrderOptionsDto } from './dto/query-sales-order-options.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrdersRepository } from './sales-orders.repository';
import { SalesOrderExpense } from './entities/sales-order-expense.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { SalesOrder } from './entities/sales-order.entity';

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly salesOrdersRepository: SalesOrdersRepository,
    private readonly customersService: CustomersService,
    private readonly countriesService: CountriesService,
    private readonly currenciesService: CurrenciesService,
    private readonly companiesService: CompaniesService,
    private readonly portsService: PortsService,
    private readonly usersService: UsersService,
    private readonly skusService: SkusService,
    private readonly filesService: FilesService,
  ) {}

  findAll(query: QuerySalesOrderDto) {
    return this.salesOrdersRepository.findAll(query);
  }

  async findById(id: number): Promise<SalesOrder & Record<string, unknown>> {
    const order = await this.salesOrdersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('销售订单不存在');
    }
    return this.withSignedUrls(order);
  }

  getOptions(_query?: QuerySalesOrderOptionsDto) {
    return {
      initialStatus: SalesOrderStatus.PENDING_SUBMIT,
      statusFlow: [
        SalesOrderStatus.PENDING_SUBMIT,
        SalesOrderStatus.IN_REVIEW,
        SalesOrderStatus.APPROVED,
        SalesOrderStatus.REJECTED,
        SalesOrderStatus.VOIDED,
      ],
      allowedTransitions: {
        [SalesOrderStatus.PENDING_SUBMIT]: [SalesOrderStatus.IN_REVIEW, SalesOrderStatus.VOIDED],
        [SalesOrderStatus.IN_REVIEW]: [SalesOrderStatus.APPROVED, SalesOrderStatus.REJECTED, SalesOrderStatus.VOIDED],
        [SalesOrderStatus.REJECTED]: [SalesOrderStatus.IN_REVIEW, SalesOrderStatus.VOIDED],
        [SalesOrderStatus.APPROVED]: [SalesOrderStatus.VOIDED],
      },
      statusActions: [
        { value: 'submit', label: '提交审核' },
        { value: 'approve', label: '审核通过' },
        { value: 'reject', label: '驳回' },
        { value: 'void', label: '作废' },
      ],
      defaults: {
        receiptStatus: ReceiptStatus.UNPAID,
        needsPurchase: YesNo.NO,
      },
    };
  }

  async create(dto: CreateSalesOrderDto, operator?: string) {
    const existing = await this.salesOrdersRepository.findByExternalOrderCode(dto.externalOrderCode);
    if (existing) {
      throw new BadRequestException('第三方订单号已存在');
    }

    const customer = await this.customersService.findById(dto.customerId);

    const destinationCountry =
      dto.destinationCountryId != null
        ? await this.countriesService.findById(dto.destinationCountryId)
        : null;
    const shipmentOriginCountry =
      dto.shipmentOriginCountryId != null
        ? await this.countriesService.findById(dto.shipmentOriginCountryId)
        : null;
    const signingCompany =
      dto.signingCompanyId != null
        ? await this.companiesService.findById(dto.signingCompanyId)
        : null;
    const currency =
      dto.currencyId != null ? await this.currenciesService.findById(dto.currencyId) : null;
    const destinationPort =
      dto.destinationPortId != null ? await this.portsService.findById(dto.destinationPortId) : null;
    const salesperson =
      dto.salespersonId != null ? await this.usersService.findById(dto.salespersonId) : null;
    const extraViewer =
      dto.extraViewerId != null ? await this.usersService.findById(dto.extraViewerId) : null;
    const merchandiser =
      dto.merchandiserId != null
        ? await this.usersService.findById(dto.merchandiserId)
        : null;
    const shipperOtherInfoCompany =
      dto.shipperOtherInfoCompanyId != null
        ? await this.companiesService.findById(dto.shipperOtherInfoCompanyId)
        : null;

    let afterSalesSourceOrder: SalesOrder | null = null;
    if (dto.afterSalesSourceOrderId != null) {
      afterSalesSourceOrder = await this.salesOrdersRepository.findById(dto.afterSalesSourceOrderId);
      if (!afterSalesSourceOrder) {
        throw new NotFoundException('售后原订单不存在');
      }
      if (afterSalesSourceOrder.orderType !== SalesOrderType.SALES) {
        throw new BadRequestException('售后原订单必须是销售订单类型');
      }
    }

    if (dto.contractFileKeys?.length !== dto.contractFileNames?.length) {
      throw new BadRequestException('合同文件 key 与名称数量不一致');
    }

    if (!dto.items?.length) {
      throw new BadRequestException('至少需要一条产品明细');
    }

    const erpSalesOrderCode = await this.salesOrdersRepository.generateErpOrderCode();

    let productTotalAmount = 0;
    const normalizedItems: Partial<SalesOrderItem>[] = [];
    for (const item of dto.items) {
      const sku = await this.skusService.findById(item.skuId);
      const purchaser =
        item.purchaserId != null
          ? await this.usersService.findById(item.purchaserId)
          : null;
      const itemCurrency =
        item.currencyId != null ? await this.currenciesService.findById(item.currencyId) : currency;

      const packagingRows = this.parsePackagingRows(sku.packagingList);
      const firstPackaging = packagingRows[0] ?? null;
      const unitWeightKg = Number(firstPackaging?.grossWeightKg ?? sku.grossWeightKg ?? 0);
      const unitVolumeCbm = Number(firstPackaging?.volumeCbm ?? sku.volumeCbm ?? 0);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const amount = Number((quantity * unitPrice).toFixed(2));
      const totalVolumeCbm = Number((unitVolumeCbm * quantity).toFixed(4));
      const totalWeightKg = Number((unitWeightKg * quantity).toFixed(4));
      productTotalAmount += amount;

      normalizedItems.push({
        skuId: sku.id,
        skuCode: sku.skuCode,
        productNameCn: item.productNameCn ?? sku.nameCn ?? null,
        productNameEn: item.productNameEn ?? sku.nameEn ?? null,
        lineType: item.lineType ?? null,
        spuId: item.spuId ?? sku.spuId ?? null,
        spuName: item.spuName ?? null,
        electricalParams: item.electricalParams ?? sku.electricalParams ?? null,
        hasPlug: item.hasPlug ?? this.normalizeBooleanToYesNo(sku.hasPlug),
        plugType: item.plugType ?? null,
        unitPrice: amount === 0 ? String(unitPrice.toFixed(2)) : String(unitPrice.toFixed(2)),
        currencyId: itemCurrency?.id ?? null,
        currencyCode: itemCurrency?.code ?? null,
        quantity,
        purchaserId: purchaser ? Number(purchaser.id) : null,
        purchaserName: purchaser?.name ?? null,
        needsPurchase: item.needsPurchase ?? YesNo.NO,
        purchaseQuantity: Number(item.purchaseQuantity ?? 0),
        useStockQuantity: Number(item.useStockQuantity ?? 0),
        preparedQuantity: Number(item.preparedQuantity ?? 0),
        shippedQuantity: Number(item.shippedQuantity ?? 0),
        amount: amount.toFixed(2),
        unitId: item.unitId ?? sku.unitId ?? null,
        unitName: item.unitName ?? null,
        material: item.material ?? sku.material ?? null,
        imageUrl: item.imageUrl ?? sku.productImageUrl ?? null,
        totalVolumeCbm: totalVolumeCbm.toFixed(4),
        totalWeightKg: totalWeightKg.toFixed(4),
        unitWeightKg: unitWeightKg.toFixed(4),
        unitVolumeCbm: unitVolumeCbm.toFixed(4),
        skuSpecification: item.skuSpecification ?? sku.specification ?? null,
        createdBy: operator,
        updatedBy: operator,
      });
    }

    const normalizedExpenses: Partial<SalesOrderExpense>[] = (dto.expenses ?? []).map((expense) => ({
      expenseName: expense.expenseName,
      amount: Number(expense.amount).toFixed(2),
      createdBy: operator,
      updatedBy: operator,
    }));

    const expenseTotalAmount = normalizedExpenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const totalAmount = Number((productTotalAmount + expenseTotalAmount).toFixed(2));
    const outstandingAmount = Number(
      (Number(dto.contractAmount) - Number(dto.receivedAmount)).toFixed(2),
    );

    const order = await this.salesOrdersRepository.createWithRelations(
      {
        erpSalesOrderCode,
        domesticTradeType: dto.domesticTradeType,
        externalOrderCode: dto.externalOrderCode,
        orderSource: dto.orderSource ?? SalesOrderSource.MANUAL,
        orderType: dto.orderType,
        customerId: customer.id,
        customerName: customer.customerName,
        customerCode: customer.customerCode,
        customerContactPerson: customer.contactPerson ?? null,
        afterSalesSourceOrderId: afterSalesSourceOrder?.id ?? null,
        afterSalesSourceOrderCode: afterSalesSourceOrder?.erpSalesOrderCode ?? null,
        afterSalesProductSummary: dto.afterSalesProductSummary ?? null,
        destinationCountryId: destinationCountry?.id ?? null,
        destinationCountryName: destinationCountry?.name ?? null,
        paymentTerm: dto.paymentTerm ?? null,
        shipmentOriginCountryId: shipmentOriginCountry?.id ?? null,
        shipmentOriginCountryName: shipmentOriginCountry?.name ?? null,
        signingCompanyId: signingCompany?.id ?? null,
        signingCompanyName: signingCompany?.nameCn ?? null,
        salespersonId: salesperson ? Number(salesperson.id) : null,
        salespersonName: salesperson?.name ?? null,
        otherIndustryNote: dto.otherIndustryNote ?? null,
        currencyId: currency?.id ?? null,
        currencyCode: currency?.code ?? null,
        currencyName: currency?.name ?? null,
        currencySymbol: currency?.symbol ?? null,
        tradeTerm: dto.tradeTerm ?? null,
        destinationPortId: destinationPort?.id ?? null,
        destinationPortName: destinationPort?.nameCn ?? null,
        bankAccount: dto.bankAccount ?? null,
        extraViewerId: extraViewer ? Number(extraViewer.id) : null,
        extraViewerName: extraViewer?.name ?? null,
        primaryIndustry: dto.primaryIndustry ?? null,
        exchangeRate:
          dto.exchangeRate != null ? Number(dto.exchangeRate).toFixed(6) : null,
        transportationMethod: dto.transportationMethod ?? null,
        crmSignedAt: dto.crmSignedAt ?? null,
        contractAmount: Number(dto.contractAmount).toFixed(2),
        orderNature: dto.orderNature ?? null,
        secondaryIndustry: dto.secondaryIndustry ?? null,
        receiptStatus: dto.receiptStatus ?? ReceiptStatus.UNPAID,
        status: SalesOrderStatus.PENDING_SUBMIT,
        contractFileKeys: dto.contractFileKeys ?? null,
        contractFileNames: dto.contractFileNames ?? null,
        receivedAmount: Number(dto.receivedAmount).toFixed(2),
        merchandiserId: merchandiser ? Number(merchandiser.id) : null,
        merchandiserName: merchandiser?.name ?? null,
        merchandiserAbbr: dto.merchandiserAbbr?.toUpperCase() ?? null,
        outstandingAmount: outstandingAmount.toFixed(2),
        requiredDeliveryAt: dto.requiredDeliveryAt ?? null,
        isSharedOrder: dto.isSharedOrder ?? null,
        isSinosure: dto.isSinosure ?? null,
        isPalletized: dto.isPalletized ?? null,
        requiresCustomsCertificate: dto.requiresCustomsCertificate ?? null,
        isSplitInAdvance: dto.isSplitInAdvance ?? null,
        usesMarketingFund: dto.usesMarketingFund ?? null,
        requiresExportCustoms: dto.requiresExportCustoms ?? null,
        requiresWarrantyCard: dto.requiresWarrantyCard ?? null,
        requiresMaternityHandover: dto.requiresMaternityHandover ?? null,
        customsDeclarationMethod: dto.customsDeclarationMethod ?? null,
        plugPhotoKeys: dto.plugPhotoKeys ?? null,
        isInsured: dto.isInsured ?? null,
        isAliTradeAssurance: dto.isAliTradeAssurance ?? null,
        aliTradeAssuranceOrderCode: dto.aliTradeAssuranceOrderCode ?? null,
        forwarderQuoteNote: dto.forwarderQuoteNote ?? null,
        consigneeCompany: dto.consigneeCompany ?? null,
        consigneeOtherInfo: dto.consigneeOtherInfo ?? null,
        notifyCompany: dto.notifyCompany ?? null,
        notifyOtherInfo: dto.notifyOtherInfo ?? null,
        shipperCompany: dto.shipperCompany ?? null,
        shipperOtherInfoCompanyId: shipperOtherInfoCompany?.id ?? null,
        shipperOtherInfoCompanyName: shipperOtherInfoCompany?.nameCn ?? null,
        domesticCustomerCompany: dto.domesticCustomerCompany ?? null,
        domesticCustomerDeliveryInfo: dto.domesticCustomerDeliveryInfo ?? null,
        usesDefaultShippingMark: dto.usesDefaultShippingMark ?? null,
        shippingMarkNote: dto.shippingMarkNote ?? null,
        shippingMarkTemplateKey: dto.shippingMarkTemplateKey ?? null,
        needsInvoice: dto.needsInvoice ?? null,
        invoiceType: dto.invoiceType ?? null,
        shippingDocumentsNote: dto.shippingDocumentsNote ?? null,
        blType: dto.blType ?? null,
        originalMailAddress: dto.originalMailAddress ?? null,
        businessRectificationNote: dto.businessRectificationNote ?? null,
        customsDocumentNote: dto.customsDocumentNote ?? null,
        otherRequirementNote: dto.otherRequirementNote ?? null,
        productTotalAmount: productTotalAmount.toFixed(2),
        expenseTotalAmount: expenseTotalAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        createdBy: operator,
        updatedBy: operator,
      },
      normalizedItems,
      normalizedExpenses,
    );

    return this.withSignedUrls(order);
  }

  async submit(id: number, operator?: string) {
    const order = await this.requireOrder(id);
    this.ensureTransition(order.status, [SalesOrderStatus.PENDING_SUBMIT, SalesOrderStatus.REJECTED], '提交审核');
    return this.withSignedUrls(
      await this.salesOrdersRepository.update(id, {
        status: SalesOrderStatus.IN_REVIEW,
        updatedBy: operator,
      }),
    );
  }

  async approve(id: number, operator?: string) {
    const order = await this.requireOrder(id);
    this.ensureTransition(order.status, [SalesOrderStatus.IN_REVIEW], '审核通过');
    return this.withSignedUrls(
      await this.salesOrdersRepository.update(id, {
        status: SalesOrderStatus.APPROVED,
        updatedBy: operator,
      }),
    );
  }

  async reject(id: number, operator?: string) {
    const order = await this.requireOrder(id);
    this.ensureTransition(order.status, [SalesOrderStatus.IN_REVIEW], '驳回');
    return this.withSignedUrls(
      await this.salesOrdersRepository.update(id, {
        status: SalesOrderStatus.REJECTED,
        updatedBy: operator,
      }),
    );
  }

  async void(id: number, operator?: string) {
    const order = await this.requireOrder(id);
    this.ensureTransition(
      order.status,
      [
        SalesOrderStatus.PENDING_SUBMIT,
        SalesOrderStatus.IN_REVIEW,
        SalesOrderStatus.REJECTED,
        SalesOrderStatus.APPROVED,
      ],
      '作废',
    );
    return this.withSignedUrls(
      await this.salesOrdersRepository.update(id, {
        status: SalesOrderStatus.VOIDED,
        updatedBy: operator,
      }),
    );
  }

  async update(_id: number, _dto: UpdateSalesOrderDto, _operator?: string) {
    throw new BadRequestException('销售订单暂不支持通用编辑，请使用状态动作端点');
  }

  private async requireOrder(id: number) {
    const order = await this.salesOrdersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('销售订单不存在');
    }
    return order;
  }

  private ensureTransition(
    current: SalesOrderStatus,
    allowedFrom: SalesOrderStatus[],
    actionLabel: string,
  ) {
    if (!allowedFrom.includes(current)) {
      throw new BadRequestException(`当前状态不允许执行${actionLabel}`);
    }
  }

  private normalizeBooleanToYesNo(value: boolean | null | undefined) {
    if (value === true) return YesNo.YES;
    if (value === false) return YesNo.NO;
    return null;
  }

  private parsePackagingRows(packagingList?: string | null): Array<Record<string, unknown>> {
    if (!packagingList) {
      return [];
    }
    try {
      const parsed = JSON.parse(packagingList);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async withSignedUrls(order: SalesOrder) {
    const contractFileUrls = order?.contractFileKeys
      ? await Promise.all(
          order.contractFileKeys.map(async (key) => {
            try {
              return await this.filesService.getSignedUrl(key);
            } catch {
              return key;
            }
          }),
        )
      : null;
    const plugPhotoUrls = order?.plugPhotoKeys
      ? await Promise.all(
          order.plugPhotoKeys.map(async (key) => {
            try {
              return await this.filesService.getSignedUrl(key);
            } catch {
              return key;
            }
          }),
        )
      : null;
    const shippingMarkTemplateUrl = order?.shippingMarkTemplateKey
      ? await this.filesService.getSignedUrl(order.shippingMarkTemplateKey).catch(() => {
          return order.shippingMarkTemplateKey;
        })
      : null;
    return {
      ...order,
      contractFileUrls,
      plugPhotoUrls,
      shippingMarkTemplateUrl,
    };
  }
}
