import { Module } from '@nestjs/common';
import { ForecastService } from './forecast.service';
@Module({
  providers: [ForecastService],
})
export class ForecastModule {}
