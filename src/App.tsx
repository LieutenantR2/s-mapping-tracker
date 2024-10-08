/** @jsxImportSource @emotion/react */
import './App.css';
import { css } from '@emotion/react';
import { useResizeObserver } from 'usehooks-ts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RegionData } from './types/RegionData';
import clsx from 'clsx';
import LOCATION_DATA from './data/Map.ts';
import React from 'react';
import PATCHES from './data/Patch.ts';
import ExpectedKills from './constants/ExpectedKills.ts';
import { LogData } from './types/LogData.ts';
import { compressedExport, findLastIndex } from './utils.ts';
import { Base64 } from 'js-base64';

import QueryStatsIcon from '@mui/icons-material/QueryStats';
import Analytics from './components/Analytics.tsx';

const Styles = css({
  flexGrow: 1,
  display: 'flex',
  justifyContent: 'stretch',
  flexDirection: 'row',

  '.copyright': {
    flexGrow: 0,
    borderTop: '1px solid rgba(255, 255, 255, 0.5)',
    padding: '6px',
    backgroundColor: '#444',
    fontSize: '0.7rem',
    textAlign: 'center',
  },

  '.sidebar': {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 0,
    width: '320px',
    height: '100%',

    '& .status': {
      margin: '0 0 24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.4)',

      '& .status-type': {
        display: 'flex',
        flexDirection: 'row',
        fontWeight: 'bold',
      },

      '& .status-a-rank': {
        marginTop: '-6px',
        padding: '0 24px 6px',

        '& .status-a-rank-button': {
          display: 'inline-block',
          width: '8px',
          height: '8px',
          backgroundColor: 'black',
          border: '2px solid white',
          borderRadius: '50%',
          cursor: 'pointer',
          marginLeft: '12px',

          '&.active': {
            backgroundColor: 'white',
          },

          '&.disabled': {
            display: 'none',
          },
        },
      },

      '& .status-type-name': {
        padding: '8px',
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '180px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },

      '& .status-type-count': {
        padding: '8px',
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: '30px',
        textAlign: 'center',
        fontSize: '1.1rem',
      },

      '& .status-type-expected': {
        fontWeight: 'normal',
        padding: '8px',
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: '30px',
        textAlign: 'center',
        fontSize: '1.1rem',
        fontStyle: 'italic',
      },

      '& .status-type-0': {
        backgroundColor: 'rgb(9, 81, 210)',

        '& .status-type-count': {
          backgroundColor: 'rgb(0, 182, 0)',
        },
      },

      '& .status-type-1': {
        backgroundColor: 'rgb(140, 81, 210)',

        '& .status-type-count': {
          backgroundColor: 'rgb(65, 134, 92)',
        },
      },

      '& .status-type-2': {
        backgroundColor: 'rgb(30, 176, 212)',

        '& .status-type-count': {
          backgroundColor: 'rgb(0, 101, 0)',
        },
      },
    },

    '& .locations-list': {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      overflowY: 'scroll',

      '& .patch-heading': {
        padding: '8px 6px',
        fontWeight: 'bold',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
      },

      '& .location-option': {
        cursor: 'pointer',
        padding: '8px',
        userSelect: 'none',

        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },

        '&.active': {
          backgroundColor: 'rgba(70, 90, 0, 0.6)',
        },
      },
    },
  },

  '.no-map-text': {
    textAlign: 'center',
  },

  '.map': {
    position: 'relative',
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    '& .clear-button': {
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      position: 'absolute',
      top: 0,
      right: 0,
      padding: '4px 8px',
      backgroundColor: 'rgba(255, 19, 14, 0.8)',
      userSelect: 'none',

      '&:hover': {
        backgroundColor: 'rgba(200, 19, 14, 0.8)',
      },
    },

    '& .analytics-button': {
      zIndex: 100,
      cursor: 'pointer',
      position: 'absolute',
      bottom: 0,
      right: 0,
      padding: '4px 8px',
      backgroundColor: 'rgb(120, 60, 60)',

      '&:hover': {
        backgroundColor: 'rgb(60, 100, 100)',
      },
    },

    '& .analytics-modal': {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      height: '40%',
      maxHeight: '300px',
      bottom: 0,
      right: 0,
      left: 0,
      backgroundColor: 'rgba(33, 33, 33, 0.9)',
      paddingRight: '52px',
    },

    '& .spawn-point': {
      color: 'rgb(222, 226, 230)',
      fontWeight: 'bold',
      position: 'absolute',
      textAlign: 'center',
      userSelect: 'none',
      borderRadius: '50%',
      width: '26px',
      height: '26px',
      marginLeft: '-13px',
      marginTop: '-13px',
      cursor: 'pointer',
      boxShadow: '2px 2px .25rem #343a40,inset -1px -1px 2px rgba(52, 58, 64, 0.5)',
      textShadow: '1px 1px 1px rgba(0, 0, 0, 0.85), 0 0 1px #000',

      '&.type-0': {
        backgroundColor: 'rgba(9, 81, 210, 0.9)',

        '&.has-data': {
          backgroundColor: 'rgba(0, 182, 0, 0.9)',
        },
      },

      '&.type-1': {
        backgroundColor: 'rgba(140, 81, 210, 0.9)',

        '&.has-data': {
          backgroundColor: 'rgba(65,134,92,0.9)',
        },
      },

      '&.type-2': {
        backgroundColor: 'rgba(30, 176, 212, 0.9)',

        '&.has-data': {
          backgroundColor: 'rgba(0, 101, 0, 0.9)',
        },
      },

      '&:hover': {
        boxShadow: '1px 1px .25rem 2px #343a40, inset -1px -1px 2px rgba(52, 58, 64, 0.5)',
      },
    },
  },
});

function getLocationBRankCounts(
  location: RegionData,
  counter: Record<string, Record<string, number>>
): Record<string, number> {
  return Object.keys(location.spawns).reduce(
    (result, bRank) => {
      result[bRank] = Object.values(counter[bRank] ?? {}).reduce((a, b) => a + b, 0);
      return result;
    },
    {} as Record<string, number>
  );
}

function getLocationTotalCount(
  location: RegionData,
  counter: Record<string, Record<string, number>>
): number {
  const bRankCounts = getLocationBRankCounts(location, counter);
  return Object.values(bRankCounts).reduce((a, b) => a + b, 0);
}

const App = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { width = 0, height = 0 } = useResizeObserver({
    ref: mapRef,
    box: 'border-box',
  });
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [ratio, setRatio] = useState(1);

  const [locationACounts, setLocationACounts] = useState<Record<string, Record<string, number>>>(
    {}
  );
  const [locationBCounts, setLocationBCounts] = useState<Record<string, number> | undefined>(
    undefined
  );
  const [counter, setCounter] = useState<Record<string, Record<string, Record<string, number>>>>(
    {}
  );
  const [selectedRegion, setSelectedRegion] = useState<RegionData | undefined>();
  const [points, setPoints] = useState<Record<string, [number, number][]>>({});
  const [spawnLog, setSpawnLog] = useState<Record<string, LogData[]>>({});
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  useEffect(() => {
    if (selectedRegion) {
      const compressedLog = compressedExport(spawnLog[selectedRegion.id] ?? [], selectedRegion);
      const base64 = Base64.toBase64(JSON.stringify(compressedLog), true);
      console.log(base64);
    }
  }, [selectedRegion, spawnLog]);

  useEffect(() => {
    if (selectedRegion) {
      setLocationBCounts(getLocationBRankCounts(selectedRegion, counter[selectedRegion.id] ?? {}));
    } else {
      setLocationBCounts(undefined);
    }
  }, [selectedRegion, counter]);

  useEffect(() => {
    if (selectedRegion) {
      setPoints(selectedRegion.spawns);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedRegion) {
      setXOffset(0);
      setYOffset(0);
      setRatio(1);
      return;
    }
    const imgLength = Math.min(width, height);
    const [xImgOffset, yImgOffset] = selectedRegion.croppedBounds[0];
    const ratio = imgLength / selectedRegion.scale;
    setXOffset((width <= imgLength ? 0 : width - imgLength) / 2.0 - ratio * xImgOffset);
    setYOffset((height <= imgLength ? 0 : height - imgLength) / 2.0 - ratio * yImgOffset);
    setRatio(ratio);
  }, [selectedRegion, width, height]);

  const handleSpawnClick = useCallback(
    (e: React.MouseEvent<HTMLSpanElement, MouseEvent>, name: string, [x, y]: [number, number]) => {
      e.preventDefault();
      e.stopPropagation();
      if (!selectedRegion) {
        return;
      }
      if (e.nativeEvent.button === 0) {
        setCounter({
          ...counter,
          [selectedRegion.id]: {
            ...(counter[selectedRegion.id] ?? {}),
            [name]: {
              ...(counter[selectedRegion.id]?.[name] ?? {}),
              [`${x},${y}`]: (counter[selectedRegion.id]?.[name]?.[`${x},${y}`] ?? 0) + 1,
            },
          },
        });
        setSpawnLog({
          ...spawnLog,
          [selectedRegion.id]: [
            ...(spawnLog[selectedRegion.id] ?? []),
            { ts: new Date().getTime(), pos: `${x},${y}` },
          ],
        });
      } else if (e.nativeEvent.button === 2) {
        setCounter({
          ...counter,
          [selectedRegion.id]: {
            ...(counter[selectedRegion.id] ?? {}),
            [name]: {
              ...(counter[selectedRegion.id]?.[name] ?? {}),
              [`${x},${y}`]: Math.max(
                0,
                (counter[selectedRegion.id]?.[name]?.[`${x},${y}`] ?? 0) - 1
              ),
            },
          },
        });
        const prevSpawnLog = [...(spawnLog[selectedRegion.id] ?? [])];
        const prevToRemove = findLastIndex(prevSpawnLog, (item) => item.pos === `${x},${y}`);
        if (prevToRemove > -1) {
          prevSpawnLog.splice(prevToRemove, 1);
          setSpawnLog({
            ...spawnLog,
            [selectedRegion.id]: prevSpawnLog,
          });
        }
      }
    },
    [spawnLog, counter, selectedRegion]
  );

  const clearCount = useCallback(() => {
    if (selectedRegion) {
      setCounter({
        ...counter,
        [selectedRegion.id]: {},
      });
      setLocationACounts({
        ...locationACounts,
        [selectedRegion.id]: {},
      });
      setSpawnLog({
        ...spawnLog,
        [selectedRegion.id]: [],
      });
    }
  }, [locationACounts, selectedRegion, counter]);

  const handleACount = useCallback(
    (bRankName: string, pos: number) => {
      if (!selectedRegion) {
        return;
      }

      const prevCount = locationACounts[selectedRegion.id]?.[bRankName] ?? 0;
      let nextCount: number;
      if (prevCount >= 2 || prevCount == 0) {
        nextCount = 1;
      } else {
        nextCount = pos == 2 ? 2 : 0;
      }
      setLocationACounts({
        ...locationACounts,
        [selectedRegion.id]: {
          ...locationACounts[selectedRegion.id],
          [bRankName]: nextCount,
        },
      });
    },
    [selectedRegion, locationACounts]
  );

  const handleAnalytics = useCallback(() => {
    setAnalyticsOpen(!analyticsOpen);
  }, [analyticsOpen]);

  return (
    <div css={Styles}>
      <div className="sidebar">
        {selectedRegion && locationBCounts && (
          <div className="status">
            {Object.keys(locationBCounts).map((bRank, i) => (
              <React.Fragment key={bRank}>
                <div className={`status-type status-type-${i}`}>
                  <span className="status-type-name">{bRank}</span>{' '}
                  <span className="status-type-expected" title="Expected number of kills">
                    {bRank !== 'A Ranks' &&
                      ExpectedKills[
                        (selectedRegion.spawns[bRank]?.length ?? 0) -
                          (locationACounts[selectedRegion.id]?.[bRank] ?? 0) -
                          (selectedRegion.patch > 2 ? 0 : 1)
                      ]}
                  </span>
                  <span className="status-type-count" title="Current total kills">
                    {locationBCounts[bRank]}
                  </span>
                </div>
                {bRank !== 'A Ranks' && (
                  <div className={`status-a-rank status-type-${i}`}>
                    A Ranks:
                    <span
                      className={clsx({
                        'status-a-rank-button': true,
                        active: (locationACounts[selectedRegion.id]?.[bRank] ?? 0) >= 1,
                        disabled:
                          (locationACounts[selectedRegion.id]?.[bRank] ?? 0) < 1 &&
                          Object.values(locationACounts[selectedRegion.id] ?? {}).reduce(
                            (a, b) => a + b,
                            0
                          ) >= 2,
                      })}
                      onClick={() => handleACount(bRank, 1)}
                      title="Select this if an A rank is alive on a spawn point"
                    />
                    <span
                      className={clsx({
                        'status-a-rank-button': true,
                        active: (locationACounts[selectedRegion.id]?.[bRank] ?? 0) >= 2,
                        disabled:
                          selectedRegion.patch < 3 ||
                          (locationACounts[selectedRegion.id]?.[bRank] ?? 0) < 1 ||
                          ((locationACounts[selectedRegion.id]?.[bRank] ?? 0) < 2 &&
                            Object.values(locationACounts[selectedRegion.id] ?? {}).reduce(
                              (a, b) => a + b,
                              0
                            ) >= 2),
                      })}
                      onClick={() => handleACount(bRank, 2)}
                      title="Select this if an A rank is alive on a spawn point"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="locations-list">
          {PATCHES.map((patch) => {
            return (
              <React.Fragment key={patch.name}>
                <div className="patch-heading">{patch.name}</div>
                {LOCATION_DATA.filter((l) => l.patch === patch.patch).map((location, i) => (
                  <div
                    className={clsx({
                      'location-option': true,
                      active: selectedRegion?.id === location.id,
                    })}
                    key={i}
                    onClick={() => setSelectedRegion(location)}
                  >
                    {location.name} ({getLocationTotalCount(location, counter[location.id] ?? {})})
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
        <span className="copyright">
          FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd. &copy; SQUARE
          ENIX
        </span>
      </div>
      <div
        ref={mapRef}
        className={clsx({ map: true, [`${selectedRegion?.id ?? 'not-selected'}`]: true })}
      >
        {selectedRegion ? (
          <>
            {Object.keys(points).map((name: string, type) => {
              return points[name].map(([x, y], i) => (
                <React.Fragment key={i}>
                  <span
                    className={clsx({
                      'spawn-point': true,
                      'has-data': !!counter[selectedRegion.id]?.[name]?.[`${x},${y}`],
                      [`type-${type}`]: true,
                    })}
                    style={{
                      left: x * ratio + xOffset,
                      top: y * ratio + yOffset,
                    }}
                    onClick={(e) => handleSpawnClick(e, name, [x, y])}
                    onContextMenu={(e) => handleSpawnClick(e, name, [x, y])}
                  >
                    {counter[selectedRegion.id]?.[name]?.[`${x},${y}`] ?? 0}
                  </span>
                </React.Fragment>
              ));
            })}
            <div className="clear-button" onClick={clearCount}>
              Clear
            </div>
            <div className="analytics-button" onClick={handleAnalytics} title="View Analytics">
              <QueryStatsIcon fontSize="large" />
            </div>
            {selectedRegion && analyticsOpen && (
              <div className="analytics-modal">
                <Analytics
                  data={spawnLog[selectedRegion.id] ?? []}
                  location={selectedRegion}
                  locationACounts={locationACounts[selectedRegion.id] ?? {}}
                />
              </div>
            )}
          </>
        ) : (
          <div className="no-map-text">Select a region to start</div>
        )}
      </div>
    </div>
  );
};

export default App;
