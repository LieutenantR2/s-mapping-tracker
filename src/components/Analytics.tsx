import {
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { LogData } from '../types/LogData.ts';
import { RegionData } from '../types/RegionData.ts';
import { ReactElement, useMemo } from 'react';
import ExpectedKills from '../constants/ExpectedKills.ts';
import React from 'react';

const colourOrder: string[] = [
  'rgb(19, 101, 230, 0.8)',
  'rgb(140, 81, 210, 0.8)',
  'rgb(30, 176, 212, 0.8)',
];
const simLineColour = 'rgba(255, 255, 100, 0.4)';

type AnalyticsProps = {
  data: LogData[];
  location: RegionData;
  locationACounts: Record<string, number>;
};

function simulate(spawnCount: number) {
  const unique = new Set<number>();
  const simResult: number[] = [];
  while (unique.size < spawnCount) {
    const spot = Math.floor(Math.random() * spawnCount);
    unique.add(spot);
    simResult.push(spot);
  }
  return simResult;
}

function transformData(data: Record<string, number[]>) {
  const series: Record<string, number>[] = [{ unique: 0 }];
  Object.keys(data).forEach((bRank) => {
    series[0][bRank] = 0;

    const spawnOrder = data[bRank];
    const unique = new Set<number>();

    for (let i = 0; i < spawnOrder.length; i++) {
      if (!unique.has(spawnOrder[i])) {
        unique.add(spawnOrder[i]);
      }
      if (series.length <= unique.size) {
        series.push({ unique: unique.size });
      }
      series[unique.size][bRank] = i + 1;
    }
  });

  return series;
}

function createDupeLines(data: Record<string, number[]>) {
  const dupeLines: ReactElement[] = [];
  Object.keys(data)
    .filter((bRank) => bRank !== 'Simulated')
    .forEach((bRank) => {
      const spawnOrder = data[bRank];
      const dupeKillCount: Record<number, number[]> = {};
      const spawnCounts: Record<number, number> = {};
      let dupeMax = 1;

      for (let i = 0; i < spawnOrder.length; i++) {
        if (spawnCounts[spawnOrder[i]] === undefined) {
          spawnCounts[spawnOrder[i]] = 0;
        }
        spawnCounts[spawnOrder[i]]++;

        if (spawnCounts[spawnOrder[i]] > dupeMax) {
          dupeMax = spawnCounts[spawnOrder[i]];

          if (!dupeKillCount[Object.keys(spawnCounts).length]) {
            dupeKillCount[Object.keys(spawnCounts).length] = [];
          }
          dupeKillCount[Object.keys(spawnCounts).length].push(dupeMax);
        }
      }

      Object.entries(dupeKillCount).forEach(([spawnCount, dupes]) => {
        const xValue = parseInt(spawnCount, 10);
        dupeLines.push(
          <ReferenceLine
            key={Math.max(...dupes)}
            x={xValue}
            strokeDasharray="1 1"
            stroke="green"
            label={{
              value: Math.max(...dupes),
              fill: 'rgba(150, 255, 150, 0.8)',
              fontStyle: 'italic',
              position: 'insideTop',
            }}
            strokeWidth={2}
          />
        );
      });
    });
  return dupeLines;
}

const Analytics = ({ data, location, locationACounts }: AnalyticsProps) => {
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
        <XAxis dataKey="unique" type="number" domain={[0, maximumSpawnCount]} stroke="white">
          <Label value="Unique Spawn Points" offset={0} position="bottom" />
        </XAxis>
        <YAxis
          type="number"
          domain={[
            0,
            (dataMax: number) =>
              Math.max(
                dataMax,
                ...Object.keys(location.spawns).map(
                  (bRank) =>
                    ExpectedKills[
                      (location.spawns[bRank]?.length ?? 0) -
                        (locationACounts[bRank] ?? 0) -
                        (location.patch > 2 ? 0 : 1)
                    ]
                )
              ),
          ]}
          stroke="white"
          label={{ value: 'Kills', angle: -90, position: 'insideLeft' }}
        />
        {Object.keys(location.spawns).length === 1 && createDupeLines(bRankSeries)}
        <Legend verticalAlign="top" iconSize={24} height={50} />
        {Object.keys(location.spawns).map((bRank, i) => (
          <React.Fragment key={bRank}>
            <Line
              key={bRank}
              type="monotone"
              dataKey={bRank}
              stroke={colourOrder[i]}
              strokeWidth={5}
            />
            <ReferenceLine
              x={
                (location.spawns[bRank]?.length ?? 0) -
                (locationACounts[bRank] ?? 0) -
                (location.patch > 2 ? 0 : 1)
              }
              stroke={colourOrder[i]}
              strokeWidth={3}
            />
            <ReferenceLine
              y={
                ExpectedKills[
                  (location.spawns[bRank]?.length ?? 0) -
                    (locationACounts[bRank] ?? 0) -
                    (location.patch > 2 ? 0 : 1)
                ]
              }
              stroke={colourOrder[i]}
              strokeDasharray="3 3"
              strokeWidth={3}
            />
          </React.Fragment>
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
