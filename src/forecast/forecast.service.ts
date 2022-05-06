import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Day,
  Report,
  ShortInfo,
  TodayInfo,
  WeatherMetadata,
} from './forecast.interface';
import { dfs_xy_conv } from './converter';
import axios from 'axios';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class ForecastService {
  private readonly redis: Redis;
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
  }

  private groupBy(data: any[], key: string): { [key: string]: any[] } {
    return data.reduce((acc, cur) => {
      (acc[cur[key]] = acc[cur[key]] || []).push(cur);
      return acc;
    }, {});
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

  async handleSqsEvent(event) {
    if (event == null) {
      return false;
    }

    const datas: TodayInfo[] = [];
    for (const record of event.Records) {
      const infor = JSON.parse(record.body);
      const { code, lat, lon } = infor.data;
      // baseDate, baseTime 구하기
      const now = new Date()
        .toLocaleString('en-GB', { hour12: false })
        .split(', ');
      const hour = parseInt(now[1].split(':')[0]);
      const [year, month, day] = now[0].split('/').reverse();
      const TODAY = `${year}${month}${day}`;
      const YESTERDAY = `${year}${month}${
        parseInt(day) - 1 < 10 ? `0${parseInt(day) - 1}` : parseInt(day) - 1
      }`;
      const baseDate = 2 < hour && hour < 24 ? TODAY : YESTERDAY;
      const baseTime = 2 < hour && hour < 24 ? '0200' : '2300';

      const todayInformations = await this.getTodayInfo(
        String(lat),
        String(lon),
        baseDate,
        baseTime,
      );

      await this.redis.set(
        `${code}:${baseDate}`,
        JSON.stringify({ data: 'test' }),
        'EX',
        600,
      );

      datas.push(todayInformations);

      const data = await this.redis.get(`${code}:${baseDate}`);
      console.log(data);
    }

    return datas;
  }

  async getTodayInfo(
    lat: string,
    lon: string,
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

    if (!lat || !lon) throw new BadRequestException();

    // 기상청 XY좌표로 변환
    const { x, y } = dfs_xy_conv('toXY', lat, lon);

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
}
