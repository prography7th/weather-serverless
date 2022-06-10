const curry2 =
  <A, B, C>(f: (a: A, b: B) => C) =>
  (a: A) =>
  (b: B): C =>
    f(a, b);

const dateFormation = <A, B>(f: (dayType: A) => B, dayType: A): B => {
  return f(dayType);
};

export const getYYYYMMDD = (dayType: 'TODAY' | 'YESTER_DAY'): string => {
  const date = dayType === 'TODAY' ? getNowDate() : getYesterDate();
  const [year, month, day] = date;
  return `${year}${month}${day}`;
};

export const getNowDate = (): string[] =>
  new Date()
    .toLocaleString('en-GB', { hour12: false })
    .split(', ')[0]
    .split('/')
    .reverse();

export const getYesterDate = (): string[] =>
  new Date(new Date().setDate(new Date().getDate() - 1))
    .toLocaleString('en-GB', { hour12: false })
    .split(', ')[0]
    .split('/')
    .reverse();

export const curriedDateFormation = curry2(dateFormation);
