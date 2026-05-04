import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SourceDocument = Source & Document;
@Schema({ timestamps: true })
export class Source {
  @Prop({ required: true, trim: true })
  name: string; // e.g. "Remotive", "Adzuna", "LinkedIn"

  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastScrapedAt: Date;
}
export const SourceSchema = SchemaFactory.createForClass(Source);
SourceSchema.index({ name: 1 }, { unique: true });
