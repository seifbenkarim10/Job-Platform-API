import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobDocument = Job & Document;

export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  FREELANCE = 'freelance',
  INTERNSHIP = 'internship',
}

export enum ExperienceLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
}

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Source' })
  source: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Skill' }] })
  skills: Types.ObjectId[];

  @Prop({ trim: true })
  location: string;

  @Prop({ default: false })
  isRemote: boolean;

  @Prop({ type: String, enum: JobType, default: JobType.FULL_TIME })
  type: JobType;

  @Prop({ type: String, enum: ExperienceLevel })
  experienceLevel: ExperienceLevel;

  @Prop()
  salaryMin: number;

  @Prop()
  salaryMax: number;

  @Prop({ trim: true })
  salaryCurrency: string;

  @Prop({ trim: true })
  applyUrl: string;

  @Prop({ trim: true })
  externalId: string; // original ID from source (for deduplication)

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  postedAt: Date;

  @Prop()
  expiresAt: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);

// Indexes for fast filtering
JobSchema.index({ title: 'text', description: 'text' }); // full-text search
JobSchema.index({ company: 1 });
JobSchema.index({ skills: 1 });
JobSchema.index({ isRemote: 1 });
JobSchema.index({ type: 1 });
JobSchema.index({ experienceLevel: 1 });
JobSchema.index({ salaryMin: 1, salaryMax: 1 });
JobSchema.index({ externalId: 1, source: 1 }, { unique: true, sparse: true }); // deduplication
JobSchema.index({ postedAt: -1 });
