import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill, SkillDocument } from './schemas/skill.schema';

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
  ) {}

  async resolveSkills(names: string[]): Promise<string[]> {
    if (!names || names.length === 0) return [];

    const ids: string[] = [];

    for (const name of names) {
      const cleaned = name.trim().toLowerCase();
      if (!cleaned) continue;

      try {
        const skill = await this.skillModel.findOneAndUpdate(
          { name: cleaned },
          { $setOnInsert: { name: cleaned } },
          { upsert: true, new: true },
        );
        ids.push(skill._id.toString());
      } catch (err: any) {
        this.logger.error(`Failed to resolve skill: ${cleaned}`, err?.message);
      }
    }

    this.logger.log(`Resolved ${ids.length} skills from ${names.length} names`);
    return ids;
  }
}
