import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ForecastModule } from './forecast/forecast.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ForecastModule,
  ],
  providers: [],
})
export class AppModule {}
