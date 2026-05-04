import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  website: string;

  @Prop({ trim: true })
  logo: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  location: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
CompanySchema.index({ name: 1 }, { unique: true });
