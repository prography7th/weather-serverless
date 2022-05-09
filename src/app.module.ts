import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ForecastModule } from './forecast/forecast.module';
import { ContentsModule } from './contents/contents.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule.forRoot({
      config: {
        url: process.env.REDIS_URL,
      },
    }),
    ForecastModule,
    ContentsModule,
  ],
  providers: [],
})
export class AppModule {}
