import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { ForecastService } from './forecast/forecast.service';

const test = {
  Records: [
    {
      body: '{"test":true,"data":{"code":"1111051500","lat":37.48685107621001,"lon":126.83860422707822}}',
    },
  ],
};

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const forecastService = appContext.get(ForecastService);
  const datas = await forecastService.handleSqsEvent(event);

  console.log(JSON.stringify(datas, null, 2));
  return {
    statusCode: HttpStatus.OK,
  };
};
