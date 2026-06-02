import { Body, Controller, Delete, Get, Logger, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DingtalkOrgUsersService } from './dingtalk-org-users.service';
import { QueryDingtalkOrgUsersDto } from './dto/query-dingtalk-org-users.dto';
import { ManualBindDingtalkOrgUserDto } from './dto/manual-bind-dingtalk-org-user.dto';

@Controller('dingtalk-org-users')
export class DingtalkOrgUsersController {
  private readonly logger = new Logger(DingtalkOrgUsersController.name);

  constructor(private readonly service: DingtalkOrgUsersService) {}

  @Get()
  findAll(@Query() query: QueryDingtalkOrgUsersDto) {
    return this.service.findAll(query);
  }

  @Post('sync')
  sync(@Body() _body: Record<string, never>, @CurrentUser() user: any) {
    this.logger.log(`Received DingTalk org sync request; operator=${user?.username ?? 'unknown'}`);
    return this.service.sync(user.username);
  }

  @Post(':id/recompute-match')
  recomputeMatch(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.service.recomputeMatch(id, user.username);
  }

  @Post(':id/confirm-binding')
  confirmBinding(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.service.confirmBinding(id, user.username);
  }

  @Post(':id/manual-binding')
  manualBind(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ManualBindDingtalkOrgUserDto,
    @CurrentUser() user: any,
  ) {
    return this.service.manualBind(id, dto.userId, user.username);
  }

  @Delete(':id/binding')
  unbind(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.service.unbind(id, user.username);
  }
}
