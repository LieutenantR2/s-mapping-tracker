import { LogData } from './types/LogData.ts';
import { RegionData } from './types/RegionData.ts';

export function findLastIndex<T>(arr: T[], testFn: (item: T) => boolean) {
  let i = arr.length - 1;
  while (i >= 0) {
    if (testFn(arr[i])) {
      return i;
    }
    i--;
  }
  return -1;
}

export function compressedExport(data: LogData[], location: RegionData) {
  return data.reduce((result, n) => {
    result.push(n.ts);
    const spawn = Object.values(location.spawns)
      .reduce((a, b) => [...a, ...b])
      .findIndex((spawn) => n.pos === `${spawn[0]},${spawn[1]}`);
    result.push(spawn);
    return result;
  }, [] as number[]);
}
