import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  findAll() {
    return this.companyModel.find({ isActive: true }).lean();
  }

  async findOne(id: string) {
    const company = await this.companyModel.findById(id).lean();
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  create(data: Partial<Company>) {
    return new this.companyModel(data).save();
  }

  findOrCreate(name: string, extra: Partial<Company> = {}) {
    return this.companyModel.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, ...extra } },
      { upsert: true, new: true },
    );
  }
}
