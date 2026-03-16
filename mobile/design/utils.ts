import { Breakpoints } from './layout';

export function responsiveFont(size: number, width: number): number {
  if (width < Breakpoints.small) {
    return size * 0.9;
  }
  if (width >= Breakpoints.tablet) {
    return size * 1.2;
  }
  return size;
}
