import { Injectable } from '@nestjs/common';
import { Day, TodayInfo } from '../forecast/forecast.interface';

@Injectable()
export class ContentsService {
  handleContents(todayInformations: Day) {
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

    return targets.map((t) => {
      const [subMessage, mainMessage] = this.getMessage(t);
      return {
        ...t,
        mainMessage,
        subMessage,
      };
    });
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
