import { Module } from '@nestjs/common';
import { ForecastService } from './forecast.service';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
@Module({
  imports: [ConfigModule, RedisModule],
  providers: [ForecastService],
})
export class ForecastModule {}
