import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PartnersService } from './partners.service';

@ApiTags('Partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  @ApiOperation({ summary: 'List all company partners and their ownership' })
  async getPartners(@Query('organizationId') orgId: string) {
    return this.partnersService.getPartners(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single partner profile and voting history' })
  async getPartnerDetails(@Param('id') id: string) {
    return this.partnersService.getPartnerDetails(id);
  }
}
