import { Module } from '@nestjs/common';
import { ContentsModule } from '../contents/contents.module';
import { ForecastService } from './forecast.service';
import { WeatherBaseHelper } from './weatherBase.helper';
@Module({
  imports: [ContentsModule],
  providers: [ForecastService, WeatherBaseHelper],
})
export class ForecastModule {}
