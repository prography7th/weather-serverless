import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ForecastService } from './forecast.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [ForecastService],
})
export class ForecastModule {}
