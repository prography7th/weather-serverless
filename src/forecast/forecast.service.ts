import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Day,
  Report,
  ShortInfo,
  TodayInfo,
  WeatherMetadata,
} from './forecast.interface';
import axios from 'axios';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { ContentsService } from '../contents/contents.service';
import { FCST_TIMES } from './forecast.interface';
import { curriedDateFormation, getYYYYMMDD } from './time';

@Injectable()
export class ForecastService {
  private readonly redis: Redis;
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
    private contentsService: ContentsService,
  ) {
    this.redis = this.redisService.getClient();
  }

  public async handleSqsEvent(event): Promise<void> {
    if (event == null) {
      throw new Error('event not found!');
    }
    const [baseDate, baseTime] = this.getWeatherTime();
    const jobQueue: Array<Promise<boolean>> = [];
    for (const record of event.Records) {
      const infor = JSON.parse(record.body);
      const { x, y } = infor.data;
      const grid = `${String(x).padStart(3, '0')}${String(y).padStart(3, '0')}`;
      const redisKey = `${grid}:${baseDate}`;
      jobQueue.push(
        this.processWeatherInformation(x, y, baseDate, baseTime, redisKey),
      );
    }
    await Promise.allSettled(jobQueue);
  }

  private async processWeatherInformation(
    x: number,
    y: number,
    baseDate: string,
    baseTime: string,
    redisKey: string,
  ): Promise<boolean> {
    try {
      const todayInformations = await this.getTodayInfo(
        Number(x),
        Number(y),
        baseDate,
        baseTime,
      );
      await this.redis.set(
        redisKey,
        JSON.stringify(todayInformations),
        'EX',
        FCST_TIMES.CACHE_TTL,
      );
      await this.setContent(redisKey, todayInformations);
    } catch (err) {
      console.error(err);
      return false;
    }
    return true;
  }

  private groupBy(data: any[], key: string): { [key: string]: any[] } {
    return data.reduce((acc, cur) => {
      (acc[cur[key]] = acc[cur[key]] || []).push(cur);
      return acc;
    }, {});
  }

  private async setContent(redisKey: string, data: TodayInfo): Promise<void> {
    redisKey = redisKey + ':content';
    await this.contentsService.handleContents(redisKey, data.today);
  }

  private async requestShort(
    endPoint: string,
    baseDate: string,
    baseTime: string,
    nx: number,
    ny: number,
  ): Promise<ShortInfo[]> {
    const SHORT_SERVICE_KEY = this.configService.get('SHORT_SERVICE_KEY');
    const responseData = (
      await axios.get(
        `${endPoint}?serviceKey=${SHORT_SERVICE_KEY}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`,
      )
    ).data;

    const {
      header: { resultCode, resultMsg },
    } = responseData.response;
    if (resultCode !== '00') {
      throw new BadRequestException(`[단기예보 조회서비스] ${resultMsg}`);
    }

    return responseData.response.body.items.item;
  }

  private async getTodayInfo(
    x: number,
    y: number,
    baseDate: string,
    baseTime: string,
  ): Promise<TodayInfo> {
    function toWeatherData(day): Day {
      const times = Object.keys(day).sort();
      const timeline: WeatherMetadata[] = times.map((time) => ({
        date: day[time][0].fcstDate,
        time: day[time][0].fcstTime,
        sky: day[time].find((item) => item.category === 'SKY').fcstValue,
        tmp: day[time].find((item) => item.category === 'TMP').fcstValue,
        pop: day[time].find((item) => item.category === 'POP').fcstValue,
        pty: day[time].find((item) => item.category === 'PTY').fcstValue,
      }));

      const maxTmpObj = times
        .map((time) => day[time].find((item) => item.category === 'TMX'))
        .filter((item) => !!item)[0];
      const minTmpObj = times
        .map((time) => day[time].find((item) => item.category === 'TMN'))
        .filter((item) => !!item)[0];
      const report: Report = {
        maxTmp: maxTmpObj ? +maxTmpObj.fcstValue : null,
        minTmp: minTmpObj ? +minTmpObj.fcstValue : null,
      };

      return { report, timeline };
    }

    if (!x || !y) throw new BadRequestException();

    // 날씨 데이터 요청
    const SHORT_END_POINT = this.configService.get('SHORT_END_POINT');
    const data = await this.requestShort(
      SHORT_END_POINT,
      baseDate,
      baseTime,
      x,
      y,
    );

    // 날짜 & 시간별 그룹화
    const groupedByTimeAfterDate = Object.values(
      this.groupBy(data, 'fcstDate'),
    ).map((day) => this.groupBy(day, 'fcstTime'));

    // 데이터 포맷팅
    const weatherData = groupedByTimeAfterDate
      .slice(0, 3)
      .map((day) => toWeatherData(day));
    const result = weatherData.reduce((acc, cur, idx) => {
      acc[['today', 'tomorrow', 'afterTomorrow'][idx]] = cur;
      return acc;
    }, {});

    // 최대 강수확률 정보 추가
    const todayTimeline = result['today'].timeline;
    let maxPop = 0;
    let time = 'all';

    for (let i = 0; i < todayTimeline.length; i++) {
      const curPop = todayTimeline[i].pop;
      if (curPop > maxPop) {
        maxPop = curPop;
        time = todayTimeline[i].time;
      }
    }

    result['today'].report.maxPop = { value: maxPop, time };

    return result;
  }

  private getWeatherTime(): [string, string] {
    const baseTime = '2300';
    if (new Date().getHours() === FCST_TIMES.CACHE_TIME)
      return [curriedDateFormation(getYYYYMMDD)('TODAY'), baseTime];
    return [curriedDateFormation(getYYYYMMDD)('YESTER_DAY'), baseTime];
  }
}
