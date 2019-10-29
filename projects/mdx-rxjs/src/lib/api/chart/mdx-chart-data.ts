import { IMdxChartSeriesGroup } from './mdx-chart-series-group';

export interface IMdxChartData {
  [measure: string]: IMdxChartSeriesGroup | undefined;
}
