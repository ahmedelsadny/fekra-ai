import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Partners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  @ApiOperation({ summary: 'List all company partners and their ownership' })
  async getPartners(@CurrentUser() user: AuthUser) {
    return this.partnersService.getPartners(user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single partner profile and voting history' })
  async getPartnerDetails(@Param('id') id: string) {
    return this.partnersService.getPartnerDetails(id);
  }
}
