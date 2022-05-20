import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Day } from '../forecast/forecast.interface';

@Injectable()
export class ContentsService {
  private readonly redis: Redis;

  constructor(private redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  public async handleContents(
    redisKey: string,
    todayInformations: Day,
  ): Promise<void> {
    const targets = todayInformations.timeline
      .filter((infor) => Number(infor.pop) >= 50)
      .map((v) => {
        let pty: any = Number(v.pty);
        pty =
          pty === 0
            ? '없음'
            : pty === 1
            ? '비'
            : pty === 2
            ? '비 혹은 눈'
            : pty === 3
            ? '눈'
            : '소나기';
        return {
          time: v.time,
          pop: v.pop,
          pty,
        };
      });
    const contents = targets.map((t) => {
      const [subMessage, mainMessage] = this.getMessage(t);
      return {
        ...t,
        mainMessage,
        subMessage,
      };
    });
    await this.redis.set(
      redisKey,
      JSON.stringify(contents),
      'EX',
      60 * 60 * 24 * 2,
    );
  }

  getMessage(infor: any): [string, string] {
    const time = Number(infor.time.slice(0, 2));
    const timeMeridiem = time < 12 ? '오전' : '오후';

    if (infor.pop >= 70) {
      return [
        `${timeMeridiem} ${time}시 이후 강수확률 ${infor.pop}%`,
        `우산을 꼭 챙겨야 하는 날`,
      ];
    } else if (infor.pop >= 50) {
      return [
        `${timeMeridiem} ${time}시 이후 강수확률 ${infor.pop}%`,
        `우산을 챙기면 좋은 날`,
      ];
    }
  }
}
