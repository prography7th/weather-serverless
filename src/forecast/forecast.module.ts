import { Module } from '@nestjs/common';
import { ContentsModule } from 'src/contents/contents.module';
import { ForecastService } from './forecast.service';
@Module({
  imports: [ContentsModule],
  providers: [ForecastService],
})
export class ForecastModule {}
