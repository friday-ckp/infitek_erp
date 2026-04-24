import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  findById(id: number): Promise<Customer | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCustomerCode(customerCode: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { customerCode } });
  }

  async findAll(query: QueryCustomerDto) {
    const { keyword, countryId, page = 1, pageSize = 20 } = query;

    const qb = this.repo.createQueryBuilder('customer');

    if (keyword) {
      qb.where(
        '(customer.customer_name LIKE :kw OR customer.customer_code LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    if (countryId != null) {
      qb.andWhere('customer.country_id = :countryId', { countryId });
    }

    const [list, total] = await qb
      .orderBy('customer.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  create(data: Partial<Customer>): Promise<Customer> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Customer>): Promise<Customer> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
