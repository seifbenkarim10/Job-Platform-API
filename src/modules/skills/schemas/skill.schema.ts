import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SkillDocument = Skill & Document;

@Schema({ timestamps: true })
export class Skill {
  @Prop({ required: true, trim: true, lowercase: true })
  name: string;

  @Prop({ trim: true })
  category: string; // e.g. "language", "framework", "tool"
}

export const SkillSchema = SchemaFactory.createForClass(Skill);
SkillSchema.index({ name: 1 }, { unique: true });
