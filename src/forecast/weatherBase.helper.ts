import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { FCST_TIMES, TodayInfo } from './forecast.interface';

@Injectable()
export class WeatherBaseHelper {
  private readonly redis: Redis;
  constructor(private redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  public async setBaseData(grid: string, todayInformations: TodayInfo) {
    this.redis.set(
      grid + ':base',
      JSON.stringify(todayInformations),
      'EX',
      FCST_TIMES.BASE_COUNT_TTL,
    );
  }
}
