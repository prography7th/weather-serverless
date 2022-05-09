import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { ContentsService } from './contents/contents.service';
import { TodayInfo } from './forecast/forecast.interface';
import { ForecastService } from './forecast/forecast.service';

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const forecastService = appContext.get(ForecastService);
  const contentsService = appContext.get(ContentsService);
  const datas = (await forecastService.handleSqsEvent(event)) as TodayInfo[];

  console.log(JSON.stringify(datas, null, 2));

  for (let data of datas) {
    const target = contentsService.handleContents(data.today);
    console.log(JSON.stringify(target, null, 2));
  }

  return {
    statusCode: HttpStatus.OK,
  };
};
