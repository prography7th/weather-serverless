import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { RedisClientType } from 'redis';
import { promisify } from 'util';

@Injectable()
export class RedisService implements OnModuleInit {
  private redisClient: RedisClientType;
  private setAsync: any;
  private getAsync: any;
  onModuleInit() {
    this.redisClient = this.getClient();
    //this.setAsync = promisify(this.redisClient.set).bind(this.redisClient);
    this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
  }

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private getClient(): RedisClientType {
    const store: any = this.cacheManager.store;
    return store.getClient();
  }

  public setData(key: string, data: any) {
    this.redisClient.set(key, data);
  }

  public async getData(key: string) {
    try {
      let data = await this.getAsync(key);
      data = JSON.parse(data);
      return data;
    } catch (err) {
      console.error(err);
    }
  }
}
