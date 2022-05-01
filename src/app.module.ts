import { Module } from '@nestjs/common';
import { SqsHandlerService } from './sqs.handler.service';

@Module({
  imports: [],
  providers: [SqsHandlerService],
})
export class AppModule {}
