import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ContractTemplatesService } from './contract-templates.service';
import { CreateContractTemplateDto } from './dto/create-contract-template.dto';
import { QueryContractTemplateDto } from './dto/query-contract-template.dto';
import { UpdateContractTemplateDto } from './dto/update-contract-template.dto';

@Controller('contract-templates')
export class ContractTemplatesController {
  constructor(private readonly contractTemplatesService: ContractTemplatesService) {}

  @Get()
  findAll(@Query() query: QueryContractTemplateDto) {
    return this.contractTemplatesService.findAll(query);
  }

  @Get('default-approved')
  findDefaultApproved() {
    return this.contractTemplatesService.findDefaultApproved();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.contractTemplatesService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateContractTemplateDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.contractTemplatesService.create(dto, user?.username);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractTemplateDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.contractTemplatesService.update(id, dto, user?.username);
  }

  @Post(':id/submit')
  submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.contractTemplatesService.submit(id, user?.username);
  }

  @Post(':id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.contractTemplatesService.approve(id, user?.username);
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.contractTemplatesService.reject(id, user?.username);
  }

  @Post(':id/void')
  voidTemplate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.contractTemplatesService.void(id, user?.username);
  }
}
