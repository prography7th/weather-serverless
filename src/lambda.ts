import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { ForecastService } from './forecast/forecast.service';

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const forecastService = appContext.get(ForecastService);
  try {
    forecastService.handleSqsEvent(event);
  } catch (err) {
    console.error(err);
  }

  return {
    statusCode: HttpStatus.OK,
  };
};
