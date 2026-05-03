import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LogisticsOrderStatus, ShippingDemandStatus } from '@infitek/shared';
import { QueryRunner } from 'typeorm';
import {
  OperationLog,
  OperationLogAction,
} from '../operation-logs/entities/operation-log.entity';
import { ShippingDemandItem } from '../shipping-demands/entities/shipping-demand-item.entity';
import { ShippingDemand } from '../shipping-demands/entities/shipping-demand.entity';
import { CreateLogisticsOrderDto } from './dto/create-logistics-order.dto';
import { QueryLogisticsOrderDto } from './dto/query-logistics-order.dto';
import { UpdateLogisticsTrackingDto } from './dto/update-logistics-tracking.dto';
import { LogisticsOrderItem } from './entities/logistics-order-item.entity';
import { LogisticsOrderPackage } from './entities/logistics-order-package.entity';
import { LogisticsOrder } from './entities/logistics-order.entity';
import { LogisticsOrdersRepository } from './logistics-orders.repository';

const MAX_LOGISTICS_ORDER_CODE_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 25;

interface LogisticsPlanLine {
  item: ShippingDemandItem;
  plannedQuantity: number;
  activePlannedQuantity: number;
  availableToPlan: number;
}

interface LogisticsPackageLine {
  shippingDemandItemId: number;
  packageNo: string;
  quantityPerBox: number;
  boxCount: number;
  totalQuantity: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  grossWeightKg?: number;
  remarks?: string;
}

@Injectable()
export class LogisticsOrdersService {
  constructor(
    private readonly logisticsOrdersRepository: LogisticsOrdersRepository,
  ) {}

  findAll(query: QueryLogisticsOrderDto) {
    return this.logisticsOrdersRepository.findAll(query);
  }

  async findById(id: number): Promise<LogisticsOrder> {
    const order = await this.logisticsOrdersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('物流单不存在');
    }
    return order;
  }

  async getCreatePrefill(shippingDemandId: number) {
    const queryRunner = this.logisticsOrdersRepository.createQueryRunner();
    try {
      await queryRunner.connect();
      const demand = await this.findShippingDemandForCreate(
        queryRunner,
        shippingDemandId,
      );
      const activePlannedByItemId =
        await this.logisticsOrdersRepository.sumActivePlannedQuantityByDemandItemIds(
          (demand.items ?? []).map((item) => Number(item.id)),
        );
      const planItems = this.buildPrefillPlanItems(
        demand,
        activePlannedByItemId,
      );
      return {
        shippingDemand: demand,
        planItems,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async create(
    dto: CreateLogisticsOrderDto,
    operator?: string,
  ): Promise<LogisticsOrder> {
    const orderId = await this.executeWithLogisticsOrderCodeRetry(
      async (queryRunner) => {
        const order = await this.createInTransaction(
          queryRunner,
          dto,
          operator,
        );
        return Number(order.id);
      },
    );

    return this.findById(orderId);
  }

  async updateTracking(
    id: number,
    dto: UpdateLogisticsTrackingDto,
    operator?: string,
  ): Promise<LogisticsOrder> {
    const orderId = await this.executeWithLogisticsOrderCodeRetry(
      async (queryRunner) => {
        const order = await this.updateTrackingInTransaction(
          queryRunner,
          id,
          dto,
          operator,
        );
        return Number(order.id);
      },
    );

    return this.findById(orderId);
  }

  private async createInTransaction(
    queryRunner: QueryRunner,
    dto: CreateLogisticsOrderDto,
    operator?: string,
  ): Promise<LogisticsOrder> {
    const demand = await this.findShippingDemandForCreate(
      queryRunner,
      dto.shippingDemandId,
      true,
    );
    const lines = await this.preparePlanLines(queryRunner, demand, dto);

    const orderRepo = queryRunner.manager.getRepository(LogisticsOrder);
    const itemRepo = queryRunner.manager.getRepository(LogisticsOrderItem);
    const packageRepo = queryRunner.manager.getRepository(
      LogisticsOrderPackage,
    );
    const orderCode = await this.generateOrderCode(queryRunner);
    const packageLines = this.preparePackageLines(dto, lines);

    const savedOrder = await orderRepo.save(
      orderRepo.create({
        orderCode,
        shippingDemandId: Number(demand.id),
        shippingDemandCode: demand.demandCode,
        salesOrderId: Number(demand.salesOrderId),
        salesOrderCode: demand.sourceDocumentCode,
        status: LogisticsOrderStatus.CONFIRMED,
        customerId: Number(demand.customerId),
        customerName: demand.customerName,
        customerCode: demand.customerCode,
        domesticTradeType: demand.domesticTradeType,
        logisticsProviderId: dto.logisticsProviderId,
        logisticsProviderName:
          dto.logisticsProviderName?.trim() ||
          `物流供应商 #${dto.logisticsProviderId}`,
        transportationMethod: dto.transportationMethod,
        companyId: dto.companyId,
        companyName:
          dto.companyName?.trim() ||
          demand.signingCompanyName ||
          `公司主体 #${dto.companyId}`,
        originPortId: dto.originPortId ?? null,
        originPortName: dto.originPortName,
        destinationPortId:
          dto.destinationPortId ?? demand.destinationPortId ?? null,
        destinationPortName: dto.destinationPortName,
        destinationCountryId:
          dto.destinationCountryId ?? demand.destinationCountryId ?? null,
        destinationCountryName: dto.destinationCountryName,
        requiredDeliveryAt: demand.requiredDeliveryAt,
        requiresExportCustoms:
          dto.requiresExportCustoms ?? demand.requiresExportCustoms,
        shippingMark: dto.shippingMark?.trim() || null,
        etd: null,
        eta: null,
        bookingNumber: null,
        carrier: null,
        vesselVoyage: null,
        blSoNumber: null,
        actualDepartureDate: null,
        consigneeCompany: demand.consigneeCompany,
        consigneeOtherInfo: demand.consigneeOtherInfo,
        notifyCompany: demand.notifyCompany,
        notifyOtherInfo: demand.notifyOtherInfo,
        shipperCompany: demand.shipperCompany,
        shipperOtherInfoCompanyName: demand.shipperOtherInfoCompanyName,
        usesDefaultShippingMark: demand.usesDefaultShippingMark,
        shippingMarkNote: demand.shippingMarkNote,
        needsInvoice: demand.needsInvoice,
        invoiceType: demand.invoiceType,
        shippingDocumentsNote: demand.shippingDocumentsNote,
        blType: demand.blType,
        originalMailAddress: demand.originalMailAddress,
        customsDocumentNote: demand.customsDocumentNote,
        otherRequirementNote: demand.otherRequirementNote,
        remarks: dto.remarks?.trim() || null,
        createdBy: operator,
        updatedBy: operator,
      }),
    );

    const savedItems = await itemRepo.save(
      lines.map((line) =>
        itemRepo.create({
          logisticsOrderId: Number(savedOrder.id),
          shippingDemandItemId: Number(line.item.id),
          salesOrderItemId: Number(line.item.salesOrderItemId),
          skuId: Number(line.item.skuId),
          skuCode: line.item.skuCode,
          productNameCn: line.item.productNameCn,
          productNameEn: line.item.productNameEn,
          skuSpecification: line.item.skuSpecification,
          unitId: line.item.unitId,
          unitName: line.item.unitName,
          lockedRemainingQuantity: Number(
            line.item.lockedRemainingQuantity ?? 0,
          ),
          plannedQuantity: line.plannedQuantity,
          outboundQuantity: 0,
          createdBy: operator,
          updatedBy: operator,
        }),
      ),
    );
    const savedItemByDemandItemId = new Map(
      savedItems.map((item) => [Number(item.shippingDemandItemId), item]),
    );

    await packageRepo.save(
      packageLines.map((pkg) => {
        const savedItem = savedItemByDemandItemId.get(pkg.shippingDemandItemId);
        return packageRepo.create({
          logisticsOrderId: Number(savedOrder.id),
          logisticsOrderItemId: savedItem ? Number(savedItem.id) : null,
          shippingDemandItemId: pkg.shippingDemandItemId,
          skuId: savedItem ? Number(savedItem.skuId) : null,
          skuCode: savedItem?.skuCode ?? null,
          packageNo: pkg.packageNo,
          quantityPerBox: pkg.quantityPerBox,
          boxCount: pkg.boxCount,
          totalQuantity: pkg.totalQuantity,
          lengthCm: this.decimalOrNull(pkg.lengthCm),
          widthCm: this.decimalOrNull(pkg.widthCm),
          heightCm: this.decimalOrNull(pkg.heightCm),
          grossWeightKg: this.decimalOrNull(pkg.grossWeightKg),
          remarks: pkg.remarks?.trim() || null,
          createdBy: operator,
          updatedBy: operator,
        });
      }),
    );

    await this.writeCreateOperationLog(
      queryRunner,
      savedOrder,
      demand,
      lines,
      operator,
    );
    return savedOrder;
  }

  private async updateTrackingInTransaction(
    queryRunner: QueryRunner,
    id: number,
    dto: UpdateLogisticsTrackingDto,
    operator?: string,
  ): Promise<LogisticsOrder> {
    if (dto.status != null) {
      throw new BadRequestException({
        code: 'LOGISTICS_TRACKING_STATUS_PATCH_FORBIDDEN',
        message: '物流跟踪更新不允许直接修改物流单状态',
      });
    }

    const orderRepo = queryRunner.manager.getRepository(LogisticsOrder);
    const order = await orderRepo.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!order) {
      throw new NotFoundException('物流单不存在');
    }

    if (
      order.status !== LogisticsOrderStatus.CONFIRMED &&
      order.status !== LogisticsOrderStatus.SHIPPED
    ) {
      throw new BadRequestException({
        code: 'LOGISTICS_TRACKING_STATUS_INVALID',
        message: '只有已确认或已发运的物流单可以编辑物流跟踪信息',
      });
    }

    const updates = this.normalizeTrackingUpdates(order, dto);
    if (!updates.length) {
      throw new BadRequestException({
        code: 'LOGISTICS_TRACKING_EMPTY',
        message: '请至少填写一个物流跟踪字段',
      });
    }

    const mutableOrder = order as unknown as Record<string, unknown>;
    for (const update of updates) {
      mutableOrder[update.field as string] = update.newValue;
    }
    order.updatedBy = operator ?? order.updatedBy ?? null;

    const savedOrder = await orderRepo.save(order);
    await this.writeTrackingUpdateOperationLog(
      queryRunner,
      savedOrder,
      updates,
      operator,
    );

    return savedOrder;
  }

  private async findShippingDemandForCreate(
    queryRunner: QueryRunner,
    shippingDemandId: number,
    lock = false,
  ): Promise<ShippingDemand> {
    const qb = queryRunner.manager
      .getRepository(ShippingDemand)
      .createQueryBuilder('demand')
      .leftJoinAndSelect('demand.items', 'items')
      .where('demand.id = :shippingDemandId', { shippingDemandId })
      .orderBy('items.id', 'ASC');

    if (lock) {
      qb.setLock('pessimistic_write');
    }

    const demand = await qb.getOne();
    if (!demand) {
      throw new NotFoundException('发货需求不存在');
    }
    if (
      demand.status !== ShippingDemandStatus.PREPARED &&
      demand.status !== ShippingDemandStatus.PARTIALLY_SHIPPED
    ) {
      throw new BadRequestException({
        code: 'LOGISTICS_ORDER_DEMAND_STATUS_INVALID',
        message: '只有备货完成或部分发货的发货需求可以创建物流单',
      });
    }
    if (!demand.items?.length) {
      throw new BadRequestException('发货需求没有产品明细，无法创建物流单');
    }
    return demand;
  }

  private buildPrefillPlanItems(
    demand: ShippingDemand,
    activePlannedByItemId: Map<number, number>,
  ) {
    return (demand.items ?? [])
      .map((item) => {
        const lockedRemainingQuantity = Number(
          item.lockedRemainingQuantity ?? 0,
        );
        const activePlannedQuantity =
          activePlannedByItemId.get(Number(item.id)) ?? 0;
        const availableToPlan = Math.max(
          0,
          lockedRemainingQuantity - activePlannedQuantity,
        );
        return {
          shippingDemandItemId: Number(item.id),
          skuId: Number(item.skuId),
          skuCode: item.skuCode,
          productNameCn: item.productNameCn,
          productNameEn: item.productNameEn,
          skuSpecification: item.skuSpecification,
          unitId: item.unitId,
          unitName: item.unitName,
          lockedRemainingQuantity,
          activePlannedQuantity,
          availableToPlan,
          plannedQuantity: availableToPlan,
        };
      })
      .filter((item) => item.availableToPlan > 0);
  }

  private async preparePlanLines(
    queryRunner: QueryRunner,
    demand: ShippingDemand,
    dto: CreateLogisticsOrderDto,
  ): Promise<LogisticsPlanLine[]> {
    if (!dto.items?.length) {
      throw new BadRequestException({
        code: 'LOGISTICS_ORDER_ITEMS_REQUIRED',
        message: '物流单必须包含产品明细',
      });
    }
    if (!dto.packages?.length) {
      throw new BadRequestException({
        code: 'LOGISTICS_ORDER_PACKAGES_REQUIRED',
        message: '物流单必须包含装箱信息',
      });
    }

    const itemById = new Map(
      (demand.items ?? []).map((item) => [Number(item.id), item]),
    );
    const activePlannedByItemId =
      await this.sumActivePlannedQuantityByDemandItemIdsInTransaction(
        queryRunner,
        [...itemById.keys()],
      );
    const seenItemIds = new Set<number>();

    return dto.items.map((line) => {
      if (seenItemIds.has(line.shippingDemandItemId)) {
        throw new BadRequestException({
          code: 'DUPLICATE_LOGISTICS_ORDER_ITEM',
          message: '物流单明细不能重复提交',
        });
      }
      seenItemIds.add(line.shippingDemandItemId);

      const item = itemById.get(line.shippingDemandItemId);
      if (!item) {
        throw new BadRequestException({
          code: 'LOGISTICS_ORDER_ITEM_NOT_IN_DEMAND',
          message: '物流单明细必须来自当前发货需求',
        });
      }
      const lockedRemainingQuantity = Number(item.lockedRemainingQuantity ?? 0);
      const activePlannedQuantity =
        activePlannedByItemId.get(line.shippingDemandItemId) ?? 0;
      const availableToPlan = lockedRemainingQuantity - activePlannedQuantity;
      if (availableToPlan <= 0) {
        throw new BadRequestException({
          code: 'NO_LOCKED_QUANTITY_TO_PLAN',
          message: `${item.skuCode} 没有可创建物流单的锁定待发数量`,
        });
      }
      if (line.plannedQuantity > availableToPlan) {
        throw new BadRequestException({
          code: 'PLANNED_QUANTITY_EXCEEDS_LOCKED',
          message: `${item.skuCode} 计划数量不能超过当前已锁定待发数量 ${availableToPlan}`,
        });
      }
      return {
        item,
        plannedQuantity: line.plannedQuantity,
        activePlannedQuantity,
        availableToPlan,
      };
    });
  }

  private preparePackageLines(
    dto: CreateLogisticsOrderDto,
    lines: LogisticsPlanLine[],
  ): LogisticsPackageLine[] {
    if (!dto.packages?.length) {
      throw new BadRequestException({
        code: 'LOGISTICS_ORDER_PACKAGES_REQUIRED',
        message: '物流单必须包含装箱信息',
      });
    }

    const lineByDemandItemId = new Map(
      lines.map((line) => [Number(line.item.id), line]),
    );
    const packedQuantityByItemId = new Map<number, number>();
    const seenPackageNos = new Set<string>();

    const packageLines = dto.packages.map((pkg) => {
      const normalizedPackageNo = pkg.packageNo.trim();
      if (!normalizedPackageNo) {
        throw new BadRequestException({
          code: 'LOGISTICS_PACKAGE_NO_REQUIRED',
          message: '箱号不能为空',
        });
      }
      if (seenPackageNos.has(normalizedPackageNo)) {
        throw new BadRequestException({
          code: 'DUPLICATE_LOGISTICS_PACKAGE_NO',
          message: `箱号 ${normalizedPackageNo} 重复，请调整后再提交`,
        });
      }
      seenPackageNos.add(normalizedPackageNo);

      const line = lineByDemandItemId.get(pkg.shippingDemandItemId);
      if (!line) {
        throw new BadRequestException({
          code: 'LOGISTICS_PACKAGE_ITEM_NOT_IN_DEMAND',
          message: '装箱信息中的 SKU 必须来自当前物流单产品明细',
        });
      }
      if (pkg.quantityPerBox * pkg.boxCount !== pkg.totalQuantity) {
        throw new BadRequestException({
          code: 'LOGISTICS_PACKAGE_TOTAL_MISMATCH',
          message: `${line.item.skuCode} 的装箱数量必须等于每箱数量乘以箱数`,
        });
      }

      packedQuantityByItemId.set(
        pkg.shippingDemandItemId,
        (packedQuantityByItemId.get(pkg.shippingDemandItemId) ?? 0) +
          pkg.totalQuantity,
      );

      return {
        shippingDemandItemId: pkg.shippingDemandItemId,
        packageNo: normalizedPackageNo,
        quantityPerBox: pkg.quantityPerBox,
        boxCount: pkg.boxCount,
        totalQuantity: pkg.totalQuantity,
        lengthCm: pkg.lengthCm,
        widthCm: pkg.widthCm,
        heightCm: pkg.heightCm,
        grossWeightKg: pkg.grossWeightKg,
        remarks: pkg.remarks,
      };
    });

    for (const line of lines) {
      const packedQuantity = packedQuantityByItemId.get(Number(line.item.id)) ?? 0;
      if (packedQuantity !== line.plannedQuantity) {
        throw new BadRequestException({
          code: 'LOGISTICS_PACKAGE_QUANTITY_MISMATCH',
          message: `${line.item.skuCode} 的装箱总数量必须等于本次计划数量 ${line.plannedQuantity}`,
        });
      }
    }

    return packageLines;
  }

  private async generateOrderCode(queryRunner: QueryRunner): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const prefix = `LOG${year}${month}${day}`;
    const latest = await queryRunner.manager
      .getRepository(LogisticsOrder)
      .createQueryBuilder('logisticsOrder')
      .setLock('pessimistic_write')
      .where('logisticsOrder.order_code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('logisticsOrder.order_code', 'DESC')
      .getOne();
    const lastNumber = latest?.orderCode
      ? Number(latest.orderCode.slice(prefix.length))
      : 0;
    return `${prefix}${String(lastNumber + 1).padStart(3, '0')}`;
  }

  private async sumActivePlannedQuantityByDemandItemIdsInTransaction(
    queryRunner: QueryRunner,
    demandItemIds: number[],
  ): Promise<Map<number, number>> {
    if (!demandItemIds.length) return new Map();
    const rows = await queryRunner.manager
      .getRepository(LogisticsOrderItem)
      .createQueryBuilder('item')
      .innerJoin('item.logisticsOrder', 'logisticsOrder')
      .select('item.shipping_demand_item_id', 'shippingDemandItemId')
      .addSelect('SUM(item.planned_quantity)', 'plannedQuantity')
      .where('item.shipping_demand_item_id IN (:...demandItemIds)', {
        demandItemIds,
      })
      .andWhere('logisticsOrder.status != :cancelled', {
        cancelled: LogisticsOrderStatus.CANCELLED,
      })
      .groupBy('item.shipping_demand_item_id')
      .getRawMany<{
        shippingDemandItemId: string;
        plannedQuantity: string;
      }>();

    return new Map(
      rows.map((row) => [
        Number(row.shippingDemandItemId),
        Number(row.plannedQuantity ?? 0),
      ]),
    );
  }

  private async writeCreateOperationLog(
    queryRunner: QueryRunner,
    order: LogisticsOrder,
    demand: ShippingDemand,
    lines: LogisticsPlanLine[],
    operator?: string,
  ): Promise<void> {
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);
    const plannedQuantity = lines.reduce(
      (sum, line) => sum + line.plannedQuantity,
      0,
    );
    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.CREATE,
        resourceType: 'logistics-orders',
        resourceId: String(order.id),
        resourcePath: '/api/logistics-orders',
        requestSummary: {
          sourceAction: 'create_logistics_order_from_shipping_demand',
          shippingDemandId: Number(demand.id),
          shippingDemandCode: demand.demandCode,
          plannedQuantity,
          itemCount: lines.length,
        },
        changeSummary: [
          {
            field: 'status',
            fieldLabel: '物流单状态',
            oldValue: null,
            newValue: LogisticsOrderStatus.CONFIRMED,
          },
        ],
      }),
    );
  }

  private async writeTrackingUpdateOperationLog(
    queryRunner: QueryRunner,
    order: LogisticsOrder,
    updates: Array<{
      field: keyof LogisticsOrder;
      fieldLabel: string;
      oldValue: unknown;
      newValue: unknown;
    }>,
    operator?: string,
  ): Promise<void> {
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);
    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.UPDATE,
        resourceType: 'logistics-orders',
        resourceId: String(order.id),
        resourcePath: `/api/logistics-orders/${order.id}/tracking`,
        requestSummary: {
          sourceAction: 'update_logistics_tracking',
          logisticsOrderId: Number(order.id),
          logisticsOrderCode: order.orderCode,
          fieldCount: updates.length,
        },
        changeSummary: updates.map((item) => ({
          field: item.field,
          fieldLabel: item.fieldLabel,
          oldValue: item.oldValue,
          newValue: item.newValue,
        })),
      }),
    );
  }

  private normalizeTrackingUpdates(
    order: LogisticsOrder,
    dto: UpdateLogisticsTrackingDto,
  ): Array<{
    field: keyof LogisticsOrder;
    fieldLabel: string;
    oldValue: unknown;
    newValue: unknown;
  }> {
    const definitions: Array<{
      field: keyof LogisticsOrder;
      rawValue: string | null | undefined;
      fieldLabel: string;
    }> = [
      { field: 'etd', rawValue: dto.etd, fieldLabel: '预计离港日期' },
      { field: 'eta', rawValue: dto.eta, fieldLabel: '预计到港日期' },
      { field: 'bookingNumber', rawValue: dto.bookingNumber, fieldLabel: '订舱号' },
      { field: 'carrier', rawValue: dto.carrier, fieldLabel: '船司/航司' },
      { field: 'vesselVoyage', rawValue: dto.vesselVoyage, fieldLabel: '船名航次' },
      { field: 'blSoNumber', rawValue: dto.blSoNumber, fieldLabel: 'SO/提单号' },
      {
        field: 'actualDepartureDate',
        rawValue: dto.actualDepartureDate,
        fieldLabel: '实际离港日期',
      },
    ];

    return definitions
      .filter((item) => item.rawValue !== undefined)
      .map((item) => {
        const newValue =
          typeof item.rawValue === 'string'
            ? item.rawValue.trim() === ''
              ? null
              : item.rawValue.trim()
            : item.rawValue ?? null;
        const oldValue = order[item.field] ?? null;
        return {
          field: item.field,
          fieldLabel: item.fieldLabel,
          oldValue,
          newValue,
        };
      })
      .filter((item) => item.oldValue !== item.newValue);
  }

  private decimalOrNull(value?: number): string | null {
    return value == null ? null : String(value);
  }

  private async executeWithLogisticsOrderCodeRetry<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    let retryCount = 0;
    while (true) {
      const queryRunner = this.logisticsOrdersRepository.createQueryRunner();
      let transactionStarted = false;

      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();
        transactionStarted = true;
        const result = await operation(queryRunner);
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        if (transactionStarted) {
          await queryRunner.rollbackTransaction();
        }

        if (
          this.isRetryableConcurrencyError(error) &&
          retryCount < MAX_LOGISTICS_ORDER_CODE_RETRIES
        ) {
          retryCount += 1;
          await this.delay(INITIAL_RETRY_DELAY_MS * 2 ** (retryCount - 1));
          continue;
        }

        if (this.isRetryableConcurrencyError(error)) {
          throw new ConflictException({
            code: 'CONCURRENT_UPDATE',
            message: '物流单并发创建失败，请稍后重试',
          });
        }

        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  }

  private isRetryableConcurrencyError(error: unknown): boolean {
    return this.isDeadlockError(error) || this.isDuplicateEntryError(error);
  }

  private isDeadlockError(error: unknown): boolean {
    const maybeError = error as { code?: string; errno?: number };
    return (
      maybeError?.code === 'ER_LOCK_DEADLOCK' || maybeError?.errno === 1213
    );
  }

  private isDuplicateEntryError(error: unknown): boolean {
    const maybeError = error as { code?: string; errno?: number };
    return maybeError?.code === 'ER_DUP_ENTRY' || maybeError?.errno === 1062;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
