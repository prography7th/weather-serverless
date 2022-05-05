import { Module } from '@nestjs/common';
import { ContentsService } from './contents.service';

@Module({
  providers: [ContentsService]
})
export class ContentsModule {}
