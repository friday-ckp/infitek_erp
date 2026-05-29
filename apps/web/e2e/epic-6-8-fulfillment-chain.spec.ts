import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';
import mysql from '../../../node_modules/.pnpm/mysql2@3.22.0_@types+node@24.12.2/node_modules/mysql2/promise.js';

const API_BASE_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/api';
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin@123';

const DB_HOST = process.env.DB_HOST ?? 'rm-bp1h00xonwd32cq0avo.mysql.rds.aliyuncs.com';
const DB_PORT = Number(process.env.DB_PORT ?? '3306');
const DB_USER = process.env.DB_USER ?? 'root';
const DB_PASS = process.env.DB_PASS ?? 'eTyjVYvG3EhbuCNyYX9s';
const DB_NAME = process.env.DB_NAME ?? 'infitek_erp';

const SalesOrderStatus = {
  PENDING_SUBMIT: 'pending_submit',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  PREPARING: 'preparing',
  PREPARED: 'prepared',
  PARTIALLY_SHIPPED: 'partially_shipped',
  SHIPPED: 'shipped',
} as const;

const ShippingDemandStatus = {
  PENDING_ALLOCATION: 'pending_allocation',
  PENDING_PURCHASE_ORDER: 'pending_purchase_order',
  PURCHASING: 'purchasing',
  PREPARED: 'prepared',
  PARTIALLY_SHIPPED: 'partially_shipped',
  SHIPPED: 'shipped',
} as const;

const PurchaseOrderStatus = {
  PENDING_CONFIRM: 'pending_confirm',
  SUPPLIER_CONFIRMING: 'supplier_confirming',
  PENDING_RECEIPT: 'pending_receipt',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
} as const;

const PurchaseOrderReceiptStatus = {
  NOT_RECEIVED: 'not_received',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
} as const;

const LogisticsOrderStatus = {
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
} as const;

const OutboundOrderStatus = {
  CONFIRMED: 'confirmed',
} as const;

const FulfillmentType = {
  FULL_PURCHASE: 'full_purchase',
  PARTIAL_PURCHASE: 'partial_purchase',
  USE_STOCK: 'use_stock',
} as const;

const InventoryChangeType = {
  INITIAL: 'initial',
  PURCHASE_RECEIPT: 'purchase_receipt',
  LOCK: 'lock',
  OUTBOUND: 'outbound',
} as const;

const TransportationMethod = {
  SEA: 'sea',
} as const;

const ReceiptOrderType = {
  PURCHASE_RECEIPT: 'purchase_receipt',
} as const;

const OutboundOrderType = {
  SALES: 'sales_outbound',
} as const;

const SalesOrderType = {
  SALES: 'sales',
} as const;

const DomesticTradeType = {
  FOREIGN: 'foreign',
} as const;

const SalesOrderSource = {
  MANUAL: 'manual',
} as const;

const YesNo = {
  YES: 'yes',
  NO: 'no',
} as const;

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
};

type PageData<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type Customer = {
  id: number;
  customerCode: string;
  customerName: string;
};

type Sku = {
  id: number;
  skuCode: string;
  nameCn: string | null;
  nameEn: string | null;
  specification: string;
  unitId: number | null;
  grossWeightKg: number | null;
  volumeCbm: number;
  material: string | null;
  productImageUrl: string | null;
  packagingList: string | null;
  electricalParams: string | null;
  hasPlug: boolean | null;
  spuId: number;
};

type Warehouse = {
  id: number;
  name: string;
  warehouseCode?: string | null;
};

type Supplier = {
  id: number;
  name: string;
  supplierCode: string;
};

type Company = {
  id: number;
  nameCn: string;
};

type Port = {
  id: number;
  nameCn: string;
  countryId: number;
  countryName: string;
};

type Country = {
  id: number;
  name: string;
};

type LogisticsProvider = {
  id: number;
  name: string;
};

type User = {
  id: string;
  username: string;
  name: string;
};

type SalesOrderItem = {
  id: number;
  skuId: number;
  skuCode: string;
  quantity: number;
  preparedQuantity: number;
  shippedQuantity: number;
};

type SalesOrder = {
  id: number;
  erpSalesOrderCode: string;
  externalOrderCode: string;
  status: string;
  customerId: number;
  customerName: string;
  currencyId: number | null;
  currencyCode: string | null;
  destinationCountryId: number | null;
  destinationCountryName: string | null;
  destinationPortId: number | null;
  destinationPortName: string | null;
  signingCompanyId: number | null;
  signingCompanyName: string | null;
  transportationMethod: string | null;
  items: SalesOrderItem[];
  shippingDemands?: Array<{ id: number; demandCode: string; status: string }>;
};

type ShippingDemandItem = {
  id: number;
  salesOrderItemId: number;
  skuId: number;
  skuCode: string;
  requiredQuantity: number;
  stockRequiredQuantity: number;
  purchaseRequiredQuantity: number;
  lockedRemainingQuantity: number;
  purchaseOrderedQuantity: number;
  receivedQuantity: number;
  shippedQuantity: number;
  purchaseSupplierId?: number | null;
};

type ShippingDemand = {
  id: number;
  demandCode: string;
  salesOrderId: number;
  sourceDocumentCode: string;
  status: string;
  customerName: string;
  customerCode: string;
  transportationMethod?: string | null;
  signingCompanyId?: number | null;
  signingCompanyName?: string | null;
  destinationCountryId?: number | null;
  destinationCountryName?: string | null;
  destinationPortId?: number | null;
  destinationPortName?: string | null;
  shipmentOriginCountryName?: string | null;
  relatedDocumentCounts?: {
    purchaseOrderCount: number;
    logisticsOrderCount: number;
    outboundOrderCount: number;
  };
  items?: ShippingDemandItem[];
};

type PurchaseOrderItem = {
  id: number;
  shippingDemandItemId: number | null;
  skuId: number;
  skuCode: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: string;
};

type PurchaseOrder = {
  id: number;
  poCode: string;
  status: string;
  receiptStatus: string;
  shippingDemandId: number | null;
  shippingDemandCode: string | null;
  salesOrderId: number | null;
  salesOrderCode: string | null;
  receivedTotalQuantity: number;
  purchaseCompanyId: number | null;
  items?: PurchaseOrderItem[];
};

type ReceiptOrderItem = {
  id: number;
  purchaseOrderItemId: number;
  skuCode: string;
  receivedQuantity: number;
  inventoryBatchId: number | null;
};

type ReceiptOrder = {
  id: number;
  receiptCode: string;
  status: string;
  purchaseOrderId: number;
  purchaseOrderCode: string;
  shippingDemandId: number | null;
  shippingDemandCode: string | null;
  totalQuantity: number;
  items?: ReceiptOrderItem[];
};

type LogisticsOrderItem = {
  id: number;
  shippingDemandItemId: number;
  skuCode: string;
  plannedQuantity: number;
  outboundQuantity: number;
};

type LogisticsOrder = {
  id: number;
  orderCode: string;
  status: string;
  shippingDemandId: number;
  shippingDemandCode: string;
  salesOrderId: number;
  salesOrderCode: string;
  items?: LogisticsOrderItem[];
};

type OutboundOrderItem = {
  id: number;
  logisticsOrderItemId: number;
  skuCode: string;
  outboundQuantity: number;
  plannedQuantity: number;
  previousOutboundQuantity: number;
  warehouseName: string;
};

type OutboundOrder = {
  id: number;
  outboundCode: string;
  status: string;
  logisticsOrderId: number;
  logisticsOrderCode: string;
  shippingDemandId: number;
  shippingDemandCode: string;
  salesOrderId: number;
  salesOrderCode: string;
  items?: OutboundOrderItem[];
};

type OperationLogRecord = {
  id: number | string;
  action: string;
  changeSummary?: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
    fieldLabel?: string;
  }>;
};

type InventorySummaryRow = {
  sku_id: number;
  warehouse_id: number;
  actual_quantity: number;
  locked_quantity: number;
  available_quantity: number;
};

type AllocationRow = {
  shipping_demand_item_id: number;
  sku_id: number;
  warehouse_id: number;
  locked_quantity: number;
  shipped_quantity: number;
  released_quantity: number;
  status: string;
  source_action_key: string;
};

type InventoryTransactionRow = {
  change_type: string;
  actual_quantity_delta: number;
  locked_quantity_delta: number;
  available_quantity_delta: number;
  source_document_type: string;
  source_document_id: number;
  source_document_item_id: number | null;
  source_action_key: string;
};

type Catalog = {
  customer: Customer;
  salesUser: User;
  receiverUser: User;
  outboundUser: User;
  skuPrimary: Sku;
  skuSecondary: Sku;
  warehouses: Warehouse[];
  supplier: Supplier;
  company: Company;
  port: Port;
  country: Country;
  logisticsProvider: LogisticsProvider;
};

type HappyPathChain = {
  warehouse: Warehouse;
  salesOrder: SalesOrder;
  demand: ShippingDemand;
  purchaseOrders: PurchaseOrder[];
  purchaseOrder: PurchaseOrder;
  duplicatePurchaseOrders: PurchaseOrder[];
  receiptOrder: ReceiptOrder;
  duplicateReceiptOrder: ReceiptOrder;
  logisticsOrder: LogisticsOrder;
  outboundOrder: OutboundOrder;
  duplicateOutboundOrder: OutboundOrder;
  finalSalesOrder: SalesOrder;
  finalDemand: ShippingDemand;
  finalPurchaseOrder: PurchaseOrder;
  finalLogisticsOrder: LogisticsOrder;
  finalSnapshot: {
    summary: InventorySummaryRow;
    allocations: AllocationRow[];
    transactions: InventoryTransactionRow[];
  };
};

type PartialPurchaseChain = {
  warehouse: Warehouse;
  salesOrder: SalesOrder;
  demand: ShippingDemand;
  purchaseOrder: PurchaseOrder;
  firstReceipt: ReceiptOrder;
  secondReceipt: ReceiptOrder;
  midDemand: ShippingDemand;
  finalDemand: ShippingDemand;
  finalPurchaseOrder: PurchaseOrder;
};

type PartialShipmentChain = {
  warehouse: Warehouse;
  salesOrder: SalesOrder;
  demand: ShippingDemand;
  logisticsOrder: LogisticsOrder;
  firstOutbound: OutboundOrder;
  secondOutbound: OutboundOrder;
  midSalesOrder: SalesOrder;
  midDemand: ShippingDemand;
  midLogisticsOrder: LogisticsOrder;
  finalSalesOrder: SalesOrder;
  finalDemand: ShippingDemand;
  finalLogisticsOrder: LogisticsOrder;
};

type ApiClient = {
  token: string;
  context: APIRequestContext;
  get: <T>(path: string, params?: Record<string, unknown>) => Promise<T>;
  post: <T>(path: string, data?: unknown) => Promise<T>;
  patch: <T>(path: string, data?: unknown) => Promise<T>;
};

function sumBy<T>(items: T[] | undefined, read: (item: T) => number) {
  return (items ?? []).reduce((sum, item) => sum + Number(read(item) ?? 0), 0);
}

function uniqueSuffix(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pickSecondDistinctSku(list: Sku[], primaryId: number): Sku | undefined {
  return list.find((item) => Number(item.id) !== Number(primaryId));
}

function firstText(page: Page, text: string | RegExp) {
  return page.getByText(text).first();
}

async function createApiClient(): Promise<ApiClient> {
  const context = await request.newContext({ baseURL: `${API_BASE_URL}/` });
  const loginResponse = await context.post('auth/login', {
    data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const loginBody = (await loginResponse.json()) as ApiEnvelope<{
    accessToken: string;
  }>;
  const token = loginBody.data.accessToken;

  async function unwrap<T>(response: Awaited<ReturnType<APIRequestContext['get']>>, path: string) {
    expect(response.ok(), `${path} should return 2xx`).toBeTruthy();
    const body = (await response.json()) as ApiEnvelope<T>;
    return body.data;
  }

  return {
    token,
    context,
    get: async <T>(path: string, params?: Record<string, unknown>) => {
      const response = await context.get(path.replace(/^\/+/, ''), {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return unwrap<T>(response, path);
    },
    post: async <T>(path: string, data?: unknown) => {
      const response = await context.post(path.replace(/^\/+/, ''), {
        headers: { Authorization: `Bearer ${token}` },
        data,
      });
      return unwrap<T>(response, path);
    },
    patch: async <T>(path: string, data?: unknown) => {
      const response = await context.patch(path.replace(/^\/+/, ''), {
        headers: { Authorization: `Bearer ${token}` },
        data,
      });
      return unwrap<T>(response, path);
    },
  };
}

async function authenticateBrowser(page: Page, token: string) {
  await page.goto('/login');
  await page.evaluate(
    ({ authToken, username }) => {
      localStorage.setItem('token', authToken);
      localStorage.setItem(
        'user',
        JSON.stringify({ username, name: username }),
      );
    },
    { authToken: token, username: ADMIN_USERNAME },
  );
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
}

async function fetchAll<T>(
  api: ApiClient,
  path: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const page = await api.get<PageData<T>>(path, { page: 1, pageSize: 200, ...params });
  return page.list;
}

async function buildCatalog(api: ApiClient): Promise<Catalog> {
  const [customers, users, skus, warehouses, suppliers, companies, ports, countries, logisticsProviders] =
    await Promise.all([
      fetchAll<Customer>(api, '/customers'),
      fetchAll<User>(api, '/users'),
      fetchAll<Sku>(api, '/skus'),
      fetchAll<Warehouse>(api, '/warehouses'),
      fetchAll<Supplier>(api, '/suppliers'),
      fetchAll<Company>(api, '/companies'),
      fetchAll<Port>(api, '/ports'),
      fetchAll<Country>(api, '/countries'),
      fetchAll<LogisticsProvider>(api, '/logistics-providers'),
    ]);

  expect(customers.length).toBeGreaterThan(0);
  expect(users.length).toBeGreaterThan(0);
  expect(skus.length).toBeGreaterThan(1);
  expect(warehouses.length).toBeGreaterThan(0);
  expect(suppliers.length).toBeGreaterThan(0);
  expect(companies.length).toBeGreaterThan(0);
  expect(ports.length).toBeGreaterThan(0);
  expect(countries.length).toBeGreaterThan(0);
  expect(logisticsProviders.length).toBeGreaterThan(0);

  const skuPrimary = skus[0];
  const skuSecondary = pickSecondDistinctSku(skus, Number(skuPrimary.id)) ?? skus[1];
  const salesUser = users[0];
  const receiverUser = users[1] ?? users[0];
  const outboundUser = users[2] ?? users[0];
  const port = ports[0];
  const country =
    countries.find((item) => Number(item.id) === Number(port.countryId)) ?? countries[0];

  return {
    customer: customers[0],
    salesUser,
    receiverUser,
    outboundUser,
    skuPrimary,
    skuSecondary,
    warehouses,
    supplier: suppliers[0],
    company: companies[0],
    port,
    country,
    logisticsProvider: logisticsProviders[0],
  };
}

async function findWarehouseForStock(
  api: ApiClient,
  warehouses: Warehouse[],
  skuId: number,
  requiredAvailableQuantity: number,
) {
  const inventory = await api.get<
    Array<{
      skuId: number;
      warehouseId: number;
      actualQuantity: number;
      lockedQuantity: number;
      availableQuantity: number;
    }>
  >('/inventory/available', {
    skuIds: String(skuId),
  });
  const byWarehouseId = new Map(
    inventory.map((item) => [Number(item.warehouseId), item]),
  );

  const existingEnough = warehouses.find(
    (warehouse) =>
      Number(byWarehouseId.get(Number(warehouse.id))?.availableQuantity ?? 0) >=
      requiredAvailableQuantity,
  );
  if (existingEnough) {
    return { warehouse: existingEnough, seeded: false };
  }

  const missingSummary = warehouses.find(
    (warehouse) => !byWarehouseId.has(Number(warehouse.id)),
  );
  expect(
    missingSummary,
    `需要至少一个未被 SKU ${skuId} 使用过的仓库来写入期初库存`,
  ).toBeTruthy();
  return { warehouse: missingSummary!, seeded: true };
}

async function ensureStockAvailable(
  api: ApiClient,
  warehouses: Warehouse[],
  skuId: number,
  requiredAvailableQuantity: number,
  receiptDate: string,
) {
  const result = await findWarehouseForStock(
    api,
    warehouses,
    skuId,
    requiredAvailableQuantity,
  );

  if (result.seeded) {
    await createOpeningInventory(
      api,
      skuId,
      result.warehouse.id,
      requiredAvailableQuantity,
      receiptDate,
    );
  }

  return result.warehouse;
}

function getItemPackaging(sku: Sku) {
  if (!sku.packagingList) {
    return {
      unitWeightKg: Number(sku.grossWeightKg ?? 0),
      unitVolumeCbm: Number(sku.volumeCbm ?? 0),
    };
  }

  try {
    const parsed = JSON.parse(sku.packagingList) as Array<{
      grossWeightKg?: number;
      volumeCbm?: number;
    }>;
    const first = parsed[0];
    return {
      unitWeightKg: Number(first?.grossWeightKg ?? sku.grossWeightKg ?? 0),
      unitVolumeCbm: Number(first?.volumeCbm ?? sku.volumeCbm ?? 0),
    };
  } catch {
    return {
      unitWeightKg: Number(sku.grossWeightKg ?? 0),
      unitVolumeCbm: Number(sku.volumeCbm ?? 0),
    };
  }
}

function buildSalesOrderItem(sku: Sku, quantity: number, unitPrice: number) {
  const { unitWeightKg, unitVolumeCbm } = getItemPackaging(sku);
  return {
    skuId: Number(sku.id),
    productNameCn: sku.nameCn ?? undefined,
    productNameEn: sku.nameEn ?? undefined,
    spuId: Number(sku.spuId),
    electricalParams: sku.electricalParams ?? undefined,
    unitPrice,
    quantity,
    needsPurchase: YesNo.NO,
    unitId: sku.unitId ?? undefined,
    material: sku.material ?? undefined,
    imageUrl: sku.productImageUrl ?? undefined,
    totalVolumeCbm: Number((unitVolumeCbm * quantity).toFixed(4)),
    totalWeightKg: Number((unitWeightKg * quantity).toFixed(4)),
    unitWeightKg: Number(unitWeightKg.toFixed(4)),
    unitVolumeCbm: Number(unitVolumeCbm.toFixed(4)),
    skuSpecification: sku.specification,
  };
}

async function createApprovedSalesOrder(
  api: ApiClient,
  catalog: Catalog,
  items: Array<{ sku: Sku; quantity: number; unitPrice: number }>,
  tag: string,
): Promise<SalesOrder> {
  const externalOrderCode = uniqueSuffix(`SO-${tag}`);
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const created = await api.post<SalesOrder>('/sales-orders', {
    domesticTradeType: DomesticTradeType.FOREIGN,
    externalOrderCode,
    orderSource: SalesOrderSource.MANUAL,
    orderType: SalesOrderType.SALES,
    customerId: catalog.customer.id,
    destinationCountryId: catalog.country.id,
    shipmentOriginCountryId: catalog.country.id,
    signingCompanyId: catalog.company.id,
    salespersonId: Number(catalog.salesUser.id),
    destinationPortId: catalog.port.id,
    transportationMethod: TransportationMethod.SEA,
    contractAmount: Number(totalAmount.toFixed(2)),
    receivedAmount: 0,
    items: items.map((item) =>
      buildSalesOrderItem(item.sku, item.quantity, item.unitPrice),
    ),
    expenses: [],
  });

  await api.post<SalesOrder>(`/sales-orders/${created.id}/submit`, {});
  await api.post<SalesOrder>(`/sales-orders/${created.id}/approve`, {});

  const approved = await api.get<SalesOrder>(`/sales-orders/${created.id}`);
  expect(approved.status).toBe(SalesOrderStatus.APPROVED);
  return approved;
}

async function createOpeningInventory(
  api: ApiClient,
  skuId: number,
  warehouseId: number,
  quantity: number,
  receiptDate: string,
) {
  return api.post('/inventory/opening-balances', {
    skuId,
    warehouseId,
    quantity,
    receiptDate,
  });
}

async function generateDemand(api: ApiClient, salesOrderId: number) {
  const demand = await api.post<ShippingDemand>(
    `/shipping-demands/generate-from-sales-order/${salesOrderId}`,
    {},
  );
  expect(demand.status).toBe(ShippingDemandStatus.PENDING_ALLOCATION);
  return api.get<ShippingDemand>(`/shipping-demands/${demand.id}`);
}

async function confirmAllocation(
  api: ApiClient,
  demandId: number,
  items: Array<{
    itemId: number;
    fulfillmentType: string;
    stockQuantity: number;
    warehouseId?: number;
    purchaseSupplierId?: number;
  }>,
) {
  return api.post<ShippingDemand>(
    `/shipping-demands/${demandId}/confirm-allocation`,
    { items },
  );
}

async function loadPurchasePrefill(api: ApiClient, shippingDemandId: number) {
  return api.get<{
    shippingDemand: ShippingDemand;
    items: Array<{
      shippingDemandItemId: number;
      purchaseRequiredQuantity: number;
      availableToOrder: number;
    }>;
  }>('/purchase-orders/create-prefill', { shippingDemandId });
}

async function createPurchaseOrdersFromDemand(
  api: ApiClient,
  shippingDemandId: number,
  requestKey: string,
  groups: Array<{
    supplierId: number;
    items: Array<{
      shippingDemandItemId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }>,
) {
  return api.post<PurchaseOrder[]>('/purchase-orders/from-shipping-demand', {
    shippingDemandId,
    requestKey,
    groups,
  });
}

async function confirmPurchaseOrderChain(api: ApiClient, purchaseOrderId: number) {
  await api.post<PurchaseOrder>(`/purchase-orders/${purchaseOrderId}/confirm-internal`, {});
  await api.post<PurchaseOrder>(`/purchase-orders/${purchaseOrderId}/confirm-supplier`, {});
  return api.get<PurchaseOrder>(`/purchase-orders/${purchaseOrderId}`);
}

async function createReceiptOrder(
  api: ApiClient,
  input: {
    purchaseOrderId: number;
    requestKey: string;
    warehouseId: number;
    receiptDate: string;
    receiverId: number;
    purchaseCompanyId?: number;
    items: Array<{ purchaseOrderItemId: number; receivedQuantity: number; warehouseId?: number }>;
  },
) {
  return api.post<ReceiptOrder>('/receipt-orders', {
    purchaseOrderId: input.purchaseOrderId,
    requestKey: input.requestKey,
    receiptType: ReceiptOrderType.PURCHASE_RECEIPT,
    warehouseId: input.warehouseId,
    receiptDate: input.receiptDate,
    receiverId: input.receiverId,
    purchaseCompanyId: input.purchaseCompanyId,
    items: input.items,
  });
}

async function createLogisticsOrder(
  api: ApiClient,
  catalog: Catalog,
  demand: ShippingDemand,
  items: Array<{ shippingDemandItemId: number; plannedQuantity: number }>,
) {
  return api.post<LogisticsOrder>('/logistics-orders', {
    shippingDemandId: demand.id,
    logisticsProviderId: catalog.logisticsProvider.id,
    companyId: catalog.company.id,
    transportationMethod: demand.transportationMethod ?? TransportationMethod.SEA,
    originPortId: catalog.port.id,
    originPortName: catalog.port.nameCn,
    destinationPortId: demand.destinationPortId ?? catalog.port.id,
    destinationPortName: demand.destinationPortName ?? catalog.port.nameCn,
    destinationCountryId: demand.destinationCountryId ?? catalog.country.id,
    destinationCountryName: demand.destinationCountryName ?? catalog.country.name,
    items,
    packages: items.map((item, index) => ({
      shippingDemandItemId: item.shippingDemandItemId,
      packageNo: `PKG-${index + 1}`,
      quantityPerBox: item.plannedQuantity,
      boxCount: 1,
      totalQuantity: item.plannedQuantity,
    })),
  });
}

async function createOutboundOrder(
  api: ApiClient,
  input: {
    logisticsOrderId: number;
    outboundUserId: number;
    warehouseId: number;
    salesCompanyId: number;
    requestKey: string;
    outboundDate: string;
    items: Array<{ logisticsOrderItemId: number; outboundQuantity: number }>;
  },
) {
  return api.post<OutboundOrder>('/outbound-orders', {
    logisticsOrderId: input.logisticsOrderId,
    outboundUserId: input.outboundUserId,
    outboundDate: input.outboundDate,
    outboundType: OutboundOrderType.SALES,
    salesCompanyId: input.salesCompanyId,
    warehouseId: input.warehouseId,
    requestKey: input.requestKey,
    items: input.items,
  });
}

async function getOperationLogs(
  api: ApiClient,
  resourceType: string,
  resourceId: number,
) {
  return api.get<PageData<OperationLogRecord>>('/v1/operation-logs', {
    resourceType,
    resourceId,
    page: 1,
    pageSize: 50,
  });
}

async function withDb<T>(run: (connection: mysql.Connection) => Promise<T>): Promise<T> {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });
  try {
    return await run(connection);
  } finally {
    await connection.end();
  }
}

async function readInventorySummary(
  skuId: number,
  warehouseId: number,
): Promise<InventorySummaryRow> {
  return withDb(async (connection) => {
    const [rows] = await connection.query<InventorySummaryRow[]>(
      `
        SELECT sku_id, warehouse_id, actual_quantity, locked_quantity, available_quantity
        FROM inventory_summary
        WHERE sku_id = ? AND warehouse_id = ?
      `,
      [skuId, warehouseId],
    );
    expect(rows.length).toBe(1);
    return rows[0];
  });
}

async function readAllocations(
  shippingDemandItemId: number,
): Promise<AllocationRow[]> {
  return withDb(async (connection) => {
    const [rows] = await connection.query<AllocationRow[]>(
      `
        SELECT
          shipping_demand_item_id,
          sku_id,
          warehouse_id,
          locked_quantity,
          shipped_quantity,
          released_quantity,
          status,
          source_action_key
        FROM shipping_demand_inventory_allocations
        WHERE shipping_demand_item_id = ?
        ORDER BY id ASC
      `,
      [shippingDemandItemId],
    );
    return rows;
  });
}

async function readInventoryTransactions(
  sourceDocumentType: string,
  sourceDocumentId: number,
): Promise<InventoryTransactionRow[]> {
  return withDb(async (connection) => {
    const [rows] = await connection.query<InventoryTransactionRow[]>(
      `
        SELECT
          change_type,
          actual_quantity_delta,
          locked_quantity_delta,
          available_quantity_delta,
          source_document_type,
          source_document_id,
          source_document_item_id,
          source_action_key
        FROM inventory_transactions
        WHERE source_document_type = ? AND source_document_id = ?
        ORDER BY id ASC
      `,
      [sourceDocumentType, sourceDocumentId],
    );
    return rows;
  });
}

async function seedHappyPathChain(api: ApiClient, catalog: Catalog): Promise<HappyPathChain> {
  const salesOrder = await createApprovedSalesOrder(
    api,
    catalog,
    [{ sku: catalog.skuPrimary, quantity: 5, unitPrice: 100 }],
    'happy',
  );

  const warehouse = await ensureStockAvailable(
    api,
    catalog.warehouses,
    catalog.skuPrimary.id,
    2,
    '2026-05-01',
  );
  const openingSummary = await readInventorySummary(
    catalog.skuPrimary.id,
    warehouse.id,
  );

  const demand = await generateDemand(api, salesOrder.id);
  const demandItem = demand.items?.[0];
  expect(demandItem).toBeTruthy();

  const allocatedDemand = await confirmAllocation(api, demand.id, [
    {
      itemId: demandItem!.id,
      fulfillmentType: FulfillmentType.PARTIAL_PURCHASE,
      stockQuantity: 2,
      warehouseId: warehouse.id,
      purchaseSupplierId: catalog.supplier.id,
    },
  ]);
  expect(allocatedDemand.status).toBe(ShippingDemandStatus.PENDING_PURCHASE_ORDER);

  const purchasePrefill = await loadPurchasePrefill(api, demand.id);
  const purchaseSource = purchasePrefill.items[0];
  expect(purchaseSource.availableToOrder).toBe(3);

  const purchaseRequestKey = uniqueSuffix('po-happy');
  const purchaseOrders = await createPurchaseOrdersFromDemand(api, demand.id, purchaseRequestKey, [
    {
      supplierId: catalog.supplier.id,
      items: [
        {
          shippingDemandItemId: purchaseSource.shippingDemandItemId,
          quantity: 3,
          unitPrice: 60,
        },
      ],
    },
  ]);
  const duplicatePurchaseOrders = await createPurchaseOrdersFromDemand(
    api,
    demand.id,
    purchaseRequestKey,
    [
      {
        supplierId: catalog.supplier.id,
        items: [
          {
            shippingDemandItemId: purchaseSource.shippingDemandItemId,
            quantity: 3,
            unitPrice: 60,
          },
        ],
      },
    ],
  );
  expect(duplicatePurchaseOrders.map((item) => item.id)).toEqual(
    purchaseOrders.map((item) => item.id),
  );

  const purchaseOrder = await confirmPurchaseOrderChain(api, purchaseOrders[0].id);
  expect(purchaseOrder.status).toBe(PurchaseOrderStatus.PENDING_RECEIPT);

  const purchaseItem = purchaseOrder.items?.[0];
  expect(purchaseItem).toBeTruthy();

  const receiptRequestKey = uniqueSuffix('receipt-happy');
  const receiptOrder = await createReceiptOrder(api, {
    purchaseOrderId: purchaseOrder.id,
    requestKey: receiptRequestKey,
    warehouseId: warehouse.id,
    receiptDate: '2026-05-02',
    receiverId: Number(catalog.receiverUser.id),
    purchaseCompanyId: purchaseOrder.purchaseCompanyId ?? catalog.company.id,
    items: [
      {
        purchaseOrderItemId: purchaseItem!.id,
        receivedQuantity: 3,
        warehouseId: warehouse.id,
      },
    ],
  });
  const duplicateReceiptOrder = await createReceiptOrder(api, {
    purchaseOrderId: purchaseOrder.id,
    requestKey: receiptRequestKey,
    warehouseId: warehouse.id,
    receiptDate: '2026-05-02',
    receiverId: Number(catalog.receiverUser.id),
    purchaseCompanyId: purchaseOrder.purchaseCompanyId ?? catalog.company.id,
    items: [
      {
        purchaseOrderItemId: purchaseItem!.id,
        receivedQuantity: 3,
        warehouseId: warehouse.id,
      },
    ],
  });
  expect(duplicateReceiptOrder.id).toBe(receiptOrder.id);

  const logisticsDemand = await api.get<ShippingDemand>(`/shipping-demands/${demand.id}`);
  expect(logisticsDemand.status).toBe(ShippingDemandStatus.PREPARED);
  const logisticsDemandItem = logisticsDemand.items?.[0];
  expect(logisticsDemandItem?.lockedRemainingQuantity).toBe(5);

  const logisticsOrder = await createLogisticsOrder(api, catalog, logisticsDemand, [
    {
      shippingDemandItemId: logisticsDemandItem!.id,
      plannedQuantity: 5,
    },
  ]);
  expect(logisticsOrder.status).toBe(LogisticsOrderStatus.CONFIRMED);

  const logisticsItem = logisticsOrder.items?.[0];
  expect(logisticsItem).toBeTruthy();

  const outboundRequestKey = uniqueSuffix('outbound-happy');
  const outboundOrder = await createOutboundOrder(api, {
    logisticsOrderId: logisticsOrder.id,
    outboundUserId: Number(catalog.outboundUser.id),
    warehouseId: warehouse.id,
    salesCompanyId: catalog.company.id,
    requestKey: outboundRequestKey,
    outboundDate: '2026-05-03',
    items: [
      {
        logisticsOrderItemId: logisticsItem!.id,
        outboundQuantity: 5,
      },
    ],
  });
  const duplicateOutboundOrder = await createOutboundOrder(api, {
    logisticsOrderId: logisticsOrder.id,
    outboundUserId: Number(catalog.outboundUser.id),
    warehouseId: warehouse.id,
    salesCompanyId: catalog.company.id,
    requestKey: outboundRequestKey,
    outboundDate: '2026-05-03',
    items: [
      {
        logisticsOrderItemId: logisticsItem!.id,
        outboundQuantity: 5,
      },
    ],
  });
  expect(duplicateOutboundOrder.id).toBe(outboundOrder.id);

  const [finalSalesOrder, finalDemand, finalPurchaseOrder, finalLogisticsOrder, finalSummary, finalAllocations, receiptTransactions, outboundTransactions] =
    await Promise.all([
      api.get<SalesOrder>(`/sales-orders/${salesOrder.id}`),
      api.get<ShippingDemand>(`/shipping-demands/${demand.id}`),
      api.get<PurchaseOrder>(`/purchase-orders/${purchaseOrder.id}`),
      api.get<LogisticsOrder>(`/logistics-orders/${logisticsOrder.id}`),
      readInventorySummary(catalog.skuPrimary.id, warehouse.id),
      readAllocations(logisticsDemandItem!.id),
      readInventoryTransactions('receipt_order', receiptOrder.id),
      readInventoryTransactions('outbound_order', outboundOrder.id),
    ]);

  return {
    warehouse,
    salesOrder,
    demand: allocatedDemand,
    purchaseOrders,
    purchaseOrder,
    duplicatePurchaseOrders,
    receiptOrder,
    duplicateReceiptOrder,
    logisticsOrder,
    outboundOrder,
    duplicateOutboundOrder,
    finalSalesOrder,
    finalDemand,
    finalPurchaseOrder,
    finalLogisticsOrder,
    finalSnapshot: {
      summary: finalSummary,
      allocations: finalAllocations,
      transactions: [...receiptTransactions, ...outboundTransactions],
    },
  };
}

async function seedPartialReceiptChain(api: ApiClient, catalog: Catalog): Promise<PartialPurchaseChain> {
  const warehouse = catalog.warehouses[0];
  const salesOrder = await createApprovedSalesOrder(
    api,
    catalog,
    [{ sku: catalog.skuSecondary, quantity: 5, unitPrice: 80 }],
    'partial-receipt',
  );
  const demand = await generateDemand(api, salesOrder.id);
  const demandItem = demand.items?.[0];
  expect(demandItem).toBeTruthy();

  const allocated = await confirmAllocation(api, demand.id, [
    {
      itemId: demandItem!.id,
      fulfillmentType: FulfillmentType.FULL_PURCHASE,
      stockQuantity: 0,
      purchaseSupplierId: catalog.supplier.id,
    },
  ]);
  expect(allocated.status).toBe(ShippingDemandStatus.PENDING_PURCHASE_ORDER);

  const purchasePrefill = await loadPurchasePrefill(api, demand.id);
  const purchaseOrders = await createPurchaseOrdersFromDemand(
    api,
    demand.id,
    uniqueSuffix('po-partial-receipt'),
    [
      {
        supplierId: catalog.supplier.id,
        items: [
          {
            shippingDemandItemId: purchasePrefill.items[0].shippingDemandItemId,
            quantity: 5,
            unitPrice: 40,
          },
        ],
      },
    ],
  );

  const purchaseOrder = await confirmPurchaseOrderChain(api, purchaseOrders[0].id);
  const purchaseItem = purchaseOrder.items?.[0];
  expect(purchaseItem).toBeTruthy();

  const firstReceipt = await createReceiptOrder(api, {
    purchaseOrderId: purchaseOrder.id,
    requestKey: uniqueSuffix('receipt-partial-1'),
    warehouseId: warehouse.id,
    receiptDate: '2026-05-04',
    receiverId: Number(catalog.receiverUser.id),
    purchaseCompanyId: purchaseOrder.purchaseCompanyId ?? catalog.company.id,
    items: [
      {
        purchaseOrderItemId: purchaseItem!.id,
        receivedQuantity: 2,
        warehouseId: warehouse.id,
      },
    ],
  });

  const midDemand = await api.get<ShippingDemand>(`/shipping-demands/${demand.id}`);
  const midPurchaseOrder = await api.get<PurchaseOrder>(`/purchase-orders/${purchaseOrder.id}`);
  expect(midDemand.status).toBe(ShippingDemandStatus.PURCHASING);
  expect(midPurchaseOrder.status).toBe(PurchaseOrderStatus.PARTIALLY_RECEIVED);
  expect(midPurchaseOrder.receiptStatus).toBe(PurchaseOrderReceiptStatus.PARTIALLY_RECEIVED);

  const secondReceipt = await createReceiptOrder(api, {
    purchaseOrderId: purchaseOrder.id,
    requestKey: uniqueSuffix('receipt-partial-2'),
    warehouseId: warehouse.id,
    receiptDate: '2026-05-05',
    receiverId: Number(catalog.receiverUser.id),
    purchaseCompanyId: purchaseOrder.purchaseCompanyId ?? catalog.company.id,
    items: [
      {
        purchaseOrderItemId: purchaseItem!.id,
        receivedQuantity: 3,
        warehouseId: warehouse.id,
      },
    ],
  });

  const [finalDemand, finalPurchaseOrder] = await Promise.all([
    api.get<ShippingDemand>(`/shipping-demands/${demand.id}`),
    api.get<PurchaseOrder>(`/purchase-orders/${purchaseOrder.id}`),
  ]);

  return {
    warehouse,
    salesOrder,
    demand,
    purchaseOrder,
    firstReceipt,
    secondReceipt,
    midDemand,
    finalDemand,
    finalPurchaseOrder,
  };
}

async function seedPartialShipmentChain(api: ApiClient, catalog: Catalog): Promise<PartialShipmentChain> {
  const warehouse = await ensureStockAvailable(
    api,
    catalog.warehouses,
    catalog.skuSecondary.id,
    4,
    '2026-05-06',
  );
  const salesOrder = await createApprovedSalesOrder(
    api,
    catalog,
    [{ sku: catalog.skuSecondary, quantity: 4, unitPrice: 90 }],
    'partial-shipment',
  );
  const demand = await generateDemand(api, salesOrder.id);
  const demandItem = demand.items?.[0];
  expect(demandItem).toBeTruthy();

  const preparedDemand = await confirmAllocation(api, demand.id, [
    {
      itemId: demandItem!.id,
      fulfillmentType: FulfillmentType.USE_STOCK,
      stockQuantity: 4,
      warehouseId: warehouse.id,
    },
  ]);
  expect(preparedDemand.status).toBe(ShippingDemandStatus.PREPARED);

  const logisticsOrder = await createLogisticsOrder(api, catalog, preparedDemand, [
    {
      shippingDemandItemId: preparedDemand.items![0].id,
      plannedQuantity: 4,
    },
  ]);
  const logisticsItem = logisticsOrder.items?.[0];
  expect(logisticsItem).toBeTruthy();

  const firstOutbound = await createOutboundOrder(api, {
    logisticsOrderId: logisticsOrder.id,
    outboundUserId: Number(catalog.outboundUser.id),
    warehouseId: warehouse.id,
    salesCompanyId: catalog.company.id,
    requestKey: uniqueSuffix('outbound-partial-1'),
    outboundDate: '2026-05-07',
    items: [
      {
        logisticsOrderItemId: logisticsItem!.id,
        outboundQuantity: 2,
      },
    ],
  });

  const [midSalesOrder, midDemand, midLogisticsOrder] = await Promise.all([
    api.get<SalesOrder>(`/sales-orders/${salesOrder.id}`),
    api.get<ShippingDemand>(`/shipping-demands/${demand.id}`),
    api.get<LogisticsOrder>(`/logistics-orders/${logisticsOrder.id}`),
  ]);
  expect(midSalesOrder.status).toBe(SalesOrderStatus.PARTIALLY_SHIPPED);
  expect(midDemand.status).toBe(ShippingDemandStatus.PARTIALLY_SHIPPED);
  expect(midLogisticsOrder.status).toBe(LogisticsOrderStatus.CONFIRMED);

  const outboundPrefill = await api.get<{
    logisticsOrder: { id: number };
    items: Array<{ logisticsOrderItemId: number; remainingQuantity: number }>;
  }>('/outbound-orders/create-prefill', { logisticsOrderId: logisticsOrder.id });

  const secondOutbound = await createOutboundOrder(api, {
    logisticsOrderId: logisticsOrder.id,
    outboundUserId: Number(catalog.outboundUser.id),
    warehouseId: warehouse.id,
    salesCompanyId: catalog.company.id,
    requestKey: uniqueSuffix('outbound-partial-2'),
    outboundDate: '2026-05-08',
    items: [
      {
        logisticsOrderItemId: outboundPrefill.items[0].logisticsOrderItemId,
        outboundQuantity: outboundPrefill.items[0].remainingQuantity,
      },
    ],
  });

  const [finalSalesOrder, finalDemand, finalLogisticsOrder] = await Promise.all([
    api.get<SalesOrder>(`/sales-orders/${salesOrder.id}`),
    api.get<ShippingDemand>(`/shipping-demands/${demand.id}`),
    api.get<LogisticsOrder>(`/logistics-orders/${logisticsOrder.id}`),
  ]);

  return {
    warehouse,
    salesOrder,
    demand: preparedDemand,
    logisticsOrder,
    firstOutbound,
    secondOutbound,
    midSalesOrder,
    midDemand,
    midLogisticsOrder,
    finalSalesOrder,
    finalDemand,
    finalLogisticsOrder,
  };
}

async function assertHappyPathFacts(api: ApiClient, chain: HappyPathChain, catalog: Catalog) {
  expect(chain.finalSalesOrder.status).toBe(SalesOrderStatus.SHIPPED);
  expect(chain.finalDemand.status).toBe(ShippingDemandStatus.SHIPPED);
  expect(chain.finalPurchaseOrder.status).toBe(PurchaseOrderStatus.RECEIVED);
  expect(chain.finalPurchaseOrder.receiptStatus).toBe(PurchaseOrderReceiptStatus.RECEIVED);
  expect(chain.finalLogisticsOrder.status).toBe(LogisticsOrderStatus.SHIPPED);
  expect(chain.outboundOrder.status).toBe(OutboundOrderStatus.CONFIRMED);

  expect(sumBy(chain.finalSalesOrder.items, (item) => item.preparedQuantity)).toBe(5);
  expect(sumBy(chain.finalSalesOrder.items, (item) => item.shippedQuantity)).toBe(5);
  expect(sumBy(chain.finalDemand.items, (item) => item.lockedRemainingQuantity)).toBe(0);
  expect(sumBy(chain.finalDemand.items, (item) => item.receivedQuantity)).toBe(3);
  expect(sumBy(chain.finalDemand.items, (item) => item.shippedQuantity)).toBe(5);
  expect(sumBy(chain.finalDemand.items, (item) => item.purchaseRequiredQuantity)).toBe(3);
  expect(sumBy(chain.finalPurchaseOrder.items, (item) => item.receivedQuantity)).toBe(3);
  expect(sumBy(chain.outboundOrder.items, (item) => item.outboundQuantity)).toBe(5);
  expect(sumBy(chain.finalLogisticsOrder.items, (item) => item.outboundQuantity)).toBe(5);

  expect(chain.finalDemand.relatedDocumentCounts?.purchaseOrderCount).toBe(1);
  expect(chain.finalDemand.relatedDocumentCounts?.logisticsOrderCount).toBe(1);
  expect(chain.finalDemand.relatedDocumentCounts?.outboundOrderCount).toBe(1);

  expect(chain.finalSnapshot.summary.actual_quantity).toBe(0);
  expect(chain.finalSnapshot.summary.locked_quantity).toBe(0);
  expect(chain.finalSnapshot.summary.available_quantity).toBe(0);

  expect(chain.finalSnapshot.allocations).toHaveLength(2);
  expect(sumBy(chain.finalSnapshot.allocations, (item) => item.locked_quantity)).toBe(0);
  expect(sumBy(chain.finalSnapshot.allocations, (item) => item.shipped_quantity)).toBe(5);
  expect(
    chain.finalSnapshot.allocations.every((item) => item.status === 'shipped'),
  ).toBeTruthy();

  const receiptTransactions = chain.finalSnapshot.transactions.filter(
    (item) => item.source_document_type === 'receipt_order',
  );
  const outboundTransactions = chain.finalSnapshot.transactions.filter(
    (item) => item.source_document_type === 'outbound_order',
  );
  expect(receiptTransactions).toHaveLength(2);
  expect(outboundTransactions).toHaveLength(1);
  expect(sumBy(receiptTransactions, (item) => item.actual_quantity_delta)).toBe(3);
  expect(sumBy(receiptTransactions, (item) => item.locked_quantity_delta)).toBe(3);
  expect(sumBy(receiptTransactions, (item) => item.available_quantity_delta)).toBe(0);
  expect(sumBy(outboundTransactions, (item) => item.actual_quantity_delta)).toBe(-5);
  expect(sumBy(outboundTransactions, (item) => item.locked_quantity_delta)).toBe(-5);
  expect(sumBy(outboundTransactions, (item) => item.available_quantity_delta)).toBe(0);

  const [purchaseLogs, receiptLogs, logisticsLogs, outboundLogs] = await Promise.all([
    getOperationLogs(api, 'purchase-orders', chain.purchaseOrder.id),
    getOperationLogs(api, 'receipt-orders', chain.receiptOrder.id),
    getOperationLogs(api, 'logistics-orders', chain.logisticsOrder.id),
    getOperationLogs(api, 'outbound-orders', chain.outboundOrder.id),
  ]);

  expect(
    purchaseLogs.list.some((record) =>
      record.changeSummary?.some(
        (change) =>
          change.field === 'status' &&
          change.oldValue === PurchaseOrderStatus.SUPPLIER_CONFIRMING &&
          change.newValue === PurchaseOrderStatus.PENDING_RECEIPT,
      ),
    ),
  ).toBeTruthy();
  expect(receiptLogs.list.some((record) => record.action === 'CREATE')).toBeTruthy();
  expect(
    logisticsLogs.list.some((record) =>
      record.changeSummary?.some(
        (change) =>
          change.field === 'status' &&
          change.oldValue === LogisticsOrderStatus.CONFIRMED &&
          change.newValue === LogisticsOrderStatus.SHIPPED,
      ),
    ),
  ).toBeTruthy();
  expect(outboundLogs.list.some((record) => record.action === 'CREATE')).toBeTruthy();

  expect(chain.finalSnapshot.summary.actual_quantity).toBeGreaterThanOrEqual(0);

  const inventoryAvailable = await api.get<
    Array<{
      skuId: number;
      warehouseId: number;
      actualQuantity: number;
      lockedQuantity: number;
      availableQuantity: number;
    }>
  >('/inventory/available', {
    skuIds: String(catalog.skuPrimary.id),
    warehouseId: chain.warehouse.id,
  });
  expect(inventoryAvailable[0]).toEqual(
    expect.objectContaining({
      actualQuantity: 0,
      lockedQuantity: 0,
      availableQuantity: 0,
    }),
  );
}

async function assertHappyPathUi(page: Page, token: string, chain: HappyPathChain) {
  await authenticateBrowser(page, token);

  await page.goto(`/sales-orders/${chain.finalSalesOrder.id}`);
  await expect(firstText(page, chain.finalSalesOrder.erpSalesOrderCode)).toBeVisible();
  await expect(firstText(page, '已发货')).toBeVisible();
  await expect(firstText(page, chain.finalDemand.demandCode)).toBeVisible();

  await page.goto(`/shipping-demands/${chain.finalDemand.id}`);
  await expect(firstText(page, chain.finalDemand.demandCode)).toBeVisible();
  await expect(firstText(page, '已发货')).toBeVisible();
  await expect(page.locator('.shipping-demand-smart-row').getByText('采购订单')).toBeVisible();
  await expect(page.locator('.shipping-demand-smart-row').getByText('物流单')).toBeVisible();
  await expect(page.locator('.shipping-demand-smart-row').getByText('出库单')).toBeVisible();
  await expect(firstText(page, '5')).toBeVisible();

  await page.goto(`/logistics-orders/${chain.finalLogisticsOrder.id}`);
  await expect(firstText(page, chain.finalLogisticsOrder.orderCode)).toBeVisible();
  await expect(firstText(page, '已发运')).toBeVisible();

  await page.goto(`/outbound-orders/${chain.outboundOrder.id}`);
  await expect(firstText(page, chain.outboundOrder.outboundCode)).toBeVisible();
  await expect(firstText(page, '已确认')).toBeVisible();
  await expect(firstText(page, chain.finalDemand.demandCode)).toBeVisible();
}

test.describe('Epic 6-8 主履约交易链 - API seed + 关键 UI 状态验证', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      '共享环境门槛测试仅在 chromium 项目执行一次',
    );
  });

  test('P0: 从销售订单创建开始的全链 happy path，覆盖幂等重复提交与库存事实校验', async ({
    page,
  }) => {
    const api = await createApiClient();
    const catalog = await buildCatalog(api);
    const chain = await seedHappyPathChain(api, catalog);

    await assertHappyPathFacts(api, chain, catalog);
    await assertHappyPathUi(page, api.token, chain);
  });

  test('P0: 部分收货保持 purchasing，全部收齐后才进入 prepared', async () => {
    const api = await createApiClient();
    const catalog = await buildCatalog(api);
    const chain = await seedPartialReceiptChain(api, catalog);

    expect(chain.midDemand.status).toBe(ShippingDemandStatus.PURCHASING);
    expect(chain.finalDemand.status).toBe(ShippingDemandStatus.PREPARED);
    expect(chain.finalPurchaseOrder.status).toBe(PurchaseOrderStatus.RECEIVED);
    expect(chain.finalPurchaseOrder.receiptStatus).toBe(PurchaseOrderReceiptStatus.RECEIVED);
    expect(chain.firstReceipt.totalQuantity).toBe(2);
    expect(chain.secondReceipt.totalQuantity).toBe(3);
    expect(sumBy(chain.finalDemand.items, (item) => item.receivedQuantity)).toBe(5);
    expect(sumBy(chain.finalDemand.items, (item) => item.lockedRemainingQuantity)).toBe(5);
  });

  test('P0: 部分出库先进入 partially_shipped，物流单保持 confirmed，全部出完后再 shipped', async ({
    page,
  }) => {
    const api = await createApiClient();
    const catalog = await buildCatalog(api);
    const chain = await seedPartialShipmentChain(api, catalog);

    expect(chain.midSalesOrder.status).toBe(SalesOrderStatus.PARTIALLY_SHIPPED);
    expect(chain.midDemand.status).toBe(ShippingDemandStatus.PARTIALLY_SHIPPED);
    expect(chain.midLogisticsOrder.status).toBe(LogisticsOrderStatus.CONFIRMED);
    expect(chain.finalSalesOrder.status).toBe(SalesOrderStatus.SHIPPED);
    expect(chain.finalDemand.status).toBe(ShippingDemandStatus.SHIPPED);
    expect(chain.finalLogisticsOrder.status).toBe(LogisticsOrderStatus.SHIPPED);

    await authenticateBrowser(page, api.token);
    await page.goto(`/shipping-demands/${chain.midDemand.id}`);
    await expect(firstText(page, chain.midDemand.demandCode)).toBeVisible();
    await expect(firstText(page, '部分发货')).toBeVisible();
  });
});
