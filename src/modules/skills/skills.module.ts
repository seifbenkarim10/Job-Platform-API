import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Skill, SkillSchema } from './schemas/skill.schema';
import { SourcesModule } from '../sources/source.module';
import { SkillsService } from './skills.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Skill.name, schema: SkillSchema }]),
  ],
  providers: [SkillsService],
  exports: [MongooseModule, SkillsService],
})
export class SkillsModule {}
