import { IMdxDimensionRow } from './mdx-dimension-row';

export interface IMdxDimensionRowResult<TDimensionData> {
  rows: IMdxDimensionRow<TDimensionData>[];
  totalCount: number | null;
}
