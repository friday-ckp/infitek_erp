import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupplierStatus } from '@infitek/shared';
import { CompaniesService } from '../companies/companies.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersRepository } from './suppliers.repository';
import { Supplier } from './entities/supplier.entity';
import { SupplierPaymentTerm } from './entities/supplier-payment-term.entity';

type SupplierPaymentTermInput =
  | NonNullable<CreateSupplierDto['paymentTerms']>[number]
  | NonNullable<UpdateSupplierDto['paymentTerms']>[number];

type NormalizedSupplierPaymentTerm = Pick<
  SupplierPaymentTerm,
  | 'companyId'
  | 'companyName'
  | 'paymentTermName'
  | 'settlementType'
  | 'settlementDays'
  | 'monthlySettlementDate'
  | 'settlementDateType'
>;

@Injectable()
export class SuppliersService {
  constructor(
    private readonly suppliersRepository: SuppliersRepository,
    private readonly companiesService: CompaniesService,
  ) {}

  async findAll(query: QuerySupplierDto) {
    const result = await this.suppliersRepository.findAll(query);
    return {
      ...result,
      list: result.list.map((supplier) => this.decorateSupplier(supplier)),
    };
  }

  async findById(id: number) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    return this.decorateSupplier(supplier);
  }

  async create(dto: CreateSupplierDto, operator?: string) {
    const duplicate = await this.suppliersRepository.findByName(dto.name);
    if (duplicate) {
      throw new BadRequestException('供应商名称已存在');
    }

    const supplierCode = await this.suppliersRepository.generateCode();
    const paymentTerms = await this.normalizePaymentTerms(dto.paymentTerms ?? []);

    const entity = this.suppliersRepository.create({
      name: dto.name,
      shortName: dto.shortName ?? null,
      supplierCode,
      contactPerson: dto.contactPerson ?? null,
      contactPhone: dto.contactPhone ?? null,
      contactEmail: dto.contactEmail ?? null,
      address: dto.address ?? null,
      countryId: dto.countryId ?? null,
      countryName: dto.countryName ?? null,
      status: dto.status ?? SupplierStatus.COOPERATING,
      supplierLevel: dto.supplierLevel ?? null,
      invoiceType: dto.invoiceType ?? null,
      origin: dto.origin ?? null,
      annualRebateEnabled: dto.annualRebateEnabled ? 1 : 0,
      contractFrameworkFile: dto.contractFrameworkFile ?? null,
      contractTemplateName: dto.contractTemplateName ?? null,
      annualRebateNote: dto.annualRebateNote ?? null,
      contractTerms: dto.contractTerms ?? null,
      ...(operator ? { createdBy: operator, updatedBy: operator } : {}),
    });

    const saved = await this.suppliersRepository.save(entity);
    await this.suppliersRepository.replacePaymentTerms(
      saved.id,
      paymentTerms.map((paymentTerm) => ({
        ...paymentTerm,
        ...(operator ? { createdBy: operator, updatedBy: operator } : {}),
      })),
    );

    const persisted = await this.suppliersRepository.findById(saved.id);
    return this.decorateSupplier(persisted!);
  }

  async update(id: number, dto: UpdateSupplierDto, operator?: string) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    if (dto.name && dto.name !== supplier.name) {
      const duplicate = await this.suppliersRepository.findByName(dto.name);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('供应商名称已存在');
      }
    }

    const paymentTerms: NormalizedSupplierPaymentTerm[] = dto.paymentTerms
      ? await this.normalizePaymentTerms(dto.paymentTerms)
      : supplier.paymentTerms.map((item) => ({
          companyId: item.companyId,
          companyName: item.companyName,
          paymentTermName: item.paymentTermName,
          settlementType: item.settlementType,
          settlementDays: item.settlementDays,
          monthlySettlementDate: item.monthlySettlementDate,
          settlementDateType: item.settlementDateType,
        }));

    const updated = await this.suppliersRepository.save({
      ...supplier,
      name: dto.name ?? supplier.name,
      shortName: dto.shortName ?? supplier.shortName,
      contactPerson: dto.contactPerson ?? supplier.contactPerson,
      contactPhone: dto.contactPhone ?? supplier.contactPhone,
      contactEmail: dto.contactEmail ?? supplier.contactEmail,
      address: dto.address ?? supplier.address,
      countryId: dto.countryId ?? supplier.countryId,
      countryName: dto.countryName ?? supplier.countryName,
      status: dto.status ?? supplier.status,
      supplierLevel: dto.supplierLevel ?? supplier.supplierLevel,
      invoiceType: dto.invoiceType ?? supplier.invoiceType,
      origin: dto.origin ?? supplier.origin,
      annualRebateEnabled:
        dto.annualRebateEnabled !== undefined
          ? dto.annualRebateEnabled
            ? 1
            : 0
          : supplier.annualRebateEnabled,
      contractFrameworkFile: dto.contractFrameworkFile ?? supplier.contractFrameworkFile,
      contractTemplateName: dto.contractTemplateName ?? supplier.contractTemplateName,
      annualRebateNote: dto.annualRebateNote ?? supplier.annualRebateNote,
      contractTerms: dto.contractTerms ?? supplier.contractTerms,
      ...(operator ? { updatedBy: operator } : {}),
    });

    if (dto.paymentTerms !== undefined) {
      await this.suppliersRepository.replacePaymentTerms(
        id,
        paymentTerms.map((paymentTerm) => ({
          ...paymentTerm,
          ...(operator ? { createdBy: operator, updatedBy: operator } : {}),
        })),
      );
    }

    const persisted = await this.suppliersRepository.findById(updated.id);
    return this.decorateSupplier(persisted!);
  }

  private async normalizePaymentTerms(
    paymentTerms?: SupplierPaymentTermInput[],
  ): Promise<NormalizedSupplierPaymentTerm[]> {
    const normalized: NormalizedSupplierPaymentTerm[] = [];

    for (const paymentTerm of paymentTerms ?? []) {
      let companyName = paymentTerm.companyName ?? null;
      if (paymentTerm.companyId) {
        const company = await this.companiesService.findById(paymentTerm.companyId);
        companyName = company.nameCn;
      }

      normalized.push({
        companyId: paymentTerm.companyId ?? null,
        companyName,
        paymentTermName: paymentTerm.paymentTermName ?? null,
        settlementType: paymentTerm.settlementType ?? null,
        settlementDays: paymentTerm.settlementDays ?? null,
        monthlySettlementDate: paymentTerm.monthlySettlementDate ?? null,
        settlementDateType: paymentTerm.settlementDateType ?? null,
      });
    }

    return normalized;
  }

  private decorateSupplier(supplier: Supplier) {
    return supplier;
  }
}
