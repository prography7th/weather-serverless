import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ForecastModule } from './forecast/forecast.module';
import { ContentsModule } from './contents/contents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ForecastModule,
    ContentsModule,
  ],
  providers: [],
})
export class AppModule {}
