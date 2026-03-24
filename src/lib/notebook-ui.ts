import type React from 'react';
import type { ItemOrigin } from './notebook-types';

const getHashFromString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const getMarkerStyle = (text: string): React.CSSProperties => {
  const hash = getHashFromString(text);
  const tilt = ((hash % 7) - 3) * 0.35;
  const topOffset = 52 + (hash % 5);
  const height = 0.9 + ((hash >> 3) % 4) * 0.03;
  const secondaryTilt = tilt * -0.6 + (((hash >> 5) % 5) - 2) * 0.12;
  const secondaryTop = 57 + ((hash >> 2) % 4);
  const secondaryHeight = 0.74 + ((hash >> 4) % 3) * 0.03;

  return {
    ['--marker-tilt' as string]: `${tilt}deg`,
    ['--marker-top' as string]: `${topOffset}%`,
    ['--marker-height' as string]: `${height}em`,
    ['--marker-secondary-tilt' as string]: `${secondaryTilt}deg`,
    ['--marker-secondary-top' as string]: `${secondaryTop}%`,
    ['--marker-secondary-height' as string]: `${secondaryHeight}em`,
  };
};

export const getOriginDotClassName = (origin: ItemOrigin) => {
  switch (origin.type) {
    case 'self':
      return 'bg-klein';
    case 'external':
      return 'bg-amber-400';
    case 'default':
    default:
      return 'bg-neutral-300';
  }
};

export const getOriginLabel = (origin: ItemOrigin) => {
  switch (origin.type) {
    case 'self':
      return '自己添加';
    case 'external':
      return origin.ownerId ? `外部导入 · ${origin.ownerId}` : '外部导入';
    case 'default':
    default:
      return '默认项目';
  }
};
