import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { LogData } from '../types/LogData.ts';
import { RegionData } from '../types/RegionData.ts';
import { useMemo } from 'react';

const colourOrder: string[] = ['rgb(19, 101, 230)', 'rgb(140, 81, 210)', 'rgb(30, 176, 212)'];
const simLineColour = 'rgba(255, 255, 100, 0.4)';

type AnalyticsProps = {
  data: LogData[];
  location: RegionData;
};

function simulate(spawnCount: number) {
  const unique = new Set<number>();
  const simResult: number[] = [];
  while (unique.size < spawnCount - 1) {
    const spot = Math.floor(Math.random() * spawnCount);
    unique.add(spot);
    simResult.push(spot);
  }
  return simResult;
}

function transformData(data: Record<string, number[]>) {
  const series: Record<string, number>[] = [];
  Object.keys(data).forEach((bRank) => {
    const spawnOrder = data[bRank];
    const unique = new Set<number>();

    for (let i = 0; i < spawnOrder.length; i++) {
      if (!unique.has(spawnOrder[i])) {
        unique.add(spawnOrder[i]);
      }
      if (series.length < unique.size) {
        series.push({ unique: unique.size });
      }
      series[unique.size - 1][bRank] = i + 1;
    }
  });

  return series;
}

const Analytics = ({ data, location }: AnalyticsProps) => {
  const maximumSpawnCount = Math.max(...Object.values(location.spawns).map((s) => s.length));
  const simulated = useMemo<number[]>(() => simulate(maximumSpawnCount), [maximumSpawnCount]);
  const spawnLookUp = Object.keys(location.spawns).reduce(
    (result, bRank) => {
      result = {
        ...result,
        ...location.spawns[bRank].reduce(
          (bRankResult, coord, i) => {
            bRankResult[`${coord[0]},${coord[1]}`] = [bRank, i];
            return bRankResult;
          },
          {} as Record<string, [string, number]>
        ),
      };
      return result;
    },
    {} as Record<string, [string, number]>
  );

  const bRankSeries: Record<string, number[]> = {};
  data.forEach((d) => {
    const [bRankName, i] = spawnLookUp[d.pos];
    if (!bRankSeries[bRankName]) {
      bRankSeries[bRankName] = [];
    }
    bRankSeries[bRankName].push(i);
  });

  return (
    <ResponsiveContainer width="100%" height="80%">
      <LineChart
        data={transformData({ ...bRankSeries, Simulated: simulated })}
        margin={{ top: 0, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="white" />
        <XAxis dataKey="unique" type="number" domain={[0, maximumSpawnCount]} stroke="white">
          <Label value="Unique Spawn Points" offset={0} position="bottom" />
        </XAxis>
        <YAxis
          type="number"
          domain={[0, 'dataMax + 5']}
          stroke="white"
          label={{ value: 'Kills', angle: -90, position: 'insideLeft' }}
        />
        <Legend verticalAlign="top" iconSize={24} height={50} />
        {Object.keys(location.spawns).map((bRank, i) => (
          <Line
            key={bRank}
            type="monotone"
            dataKey={bRank}
            stroke={colourOrder[i]}
            strokeWidth={5}
          />
        ))}
        <Line
          type="monotone"
          dataKey="Simulated"
          stroke={simLineColour}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Analytics;
