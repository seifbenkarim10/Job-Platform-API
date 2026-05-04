import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Company } from './schemas/company.schema';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Company>) {
    return this.companiesService.create(body);
  }
}
