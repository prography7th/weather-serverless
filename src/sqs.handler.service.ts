import { Injectable } from '@nestjs/common';

@Injectable()
export class SqsHandlerService {
  constructor() {}

  async handleSqsEvent(job: any) {
    console.log(job);
  }
}
