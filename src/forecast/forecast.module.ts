import { Module } from '@nestjs/common';
import { ForecastService } from './forecast.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule],
  providers: [ForecastService],
})
export class ForecastModule {}
