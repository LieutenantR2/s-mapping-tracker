/** @jsxImportSource @emotion/react */
import './App.css';
import { css } from '@emotion/react';
import { useResizeObserver } from 'usehooks-ts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RegionData } from './types/RegionData';
import clsx from 'clsx';
import LOCATION_DATA from './data/Map.ts';
import React from 'react';

const Styles = css({
  flexGrow: 1,
  display: 'flex',
  justifyContent: 'stretch',
  flexDirection: 'row',

  '& .sidebar': {
    flexGrow: 0,
    width: '250px',
  },

  '& .map': {
    position: 'relative',
    flexGrow: 1,

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
          backgroundColor: 'rgba(0,101,0,0.9)',
        },
      },

      '&.type-1': {
        backgroundColor: 'rgba(140, 81, 210, 0.9)',

        '&.has-data': {
          backgroundColor: 'rgba(0,182,0,0.9)',
        },
      },

      '&.type-2': {
        backgroundColor: 'rgba(30,176,212,0.9)',

        '&.has-data': {
          backgroundColor: 'rgba(78,169,112,0.9)',
        },
      },

      '&:hover': {
        boxShadow: '1px 1px .25rem 2px #343a40, inset -1px -1px 2px rgba(52, 58, 64, 0.5)',
      },
    },
  },
});

function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const { width = 0, height = 0 } = useResizeObserver({
    ref: mapRef,
    box: 'border-box',
  });
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [ratio, setRatio] = useState(1);

  const [counter, setCounter] = useState<Record<string, Record<string, Record<string, number>>>>(
    {}
  );
  const [selectedRegion, setSelectedRegion] = useState<RegionData>(LOCATION_DATA[0]);
  const [points, setPoints] = useState<Record<string, [number, number][]>>({});

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
      }
      e.preventDefault();
      e.stopPropagation();
    },
    [counter, selectedRegion]
  );

  return (
    <div css={Styles}>
      <div className="sidebar">
        {LOCATION_DATA.map((location, i) => (
          <div className="location-option" key={i} onClick={() => setSelectedRegion(location)}>
            {location.name}
          </div>
        ))}
      </div>
      {selectedRegion ? (
        <div ref={mapRef} className={clsx({ map: true, [`${selectedRegion.id}`]: true })}>
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
        </div>
      ) : (
        <div>Select a region to start</div>
      )}
    </div>
  );
}

export default App;
