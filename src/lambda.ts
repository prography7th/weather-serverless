import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { SqsHandlerService } from './sqs.handler.service';

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const sqsService = appContext.get(SqsHandlerService);

  return {
    body: sqsService.handleSqsEvent(event),
    statusCode: HttpStatus.OK,
  };
};
