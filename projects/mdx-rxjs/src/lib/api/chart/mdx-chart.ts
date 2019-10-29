import { MdxValue } from '../../mdx-expressions';
import { MdxMemberSet } from '../mdx-member-set';
import { IMdxChartData } from './mdx-chart-data';
import { IMdxChartSeriesGroup } from './mdx-chart-series-group';

export type MapMdxSeriesDelegate<TSeries> = (data: number[], name: string, measure: string) => TSeries;
export type ZipMdxSeriesDelegate<TSeries> = (data: number[][], name: string, measures: string[]) => TSeries;

export interface IMdxChartSelector {
  filterMeasures(predicate: (measure: string, index: number, measures: string[]) => boolean): IMdxChartSelector;
  filterSeriesNames(predicate: (seriesName: string, index: number, seriesNames: string[]) => boolean): IMdxChartSelector;
  map<TSeries>(map: MapMdxSeriesDelegate<TSeries>): TSeries[];
  zip<TSeries>(map: ZipMdxSeriesDelegate<TSeries>): TSeries[];
}

export interface IMdxChart extends IMdxChartSelector {
  data: IMdxChartData;
  measures: string[];
  seriesNames: string[];
  xAxis: NonNullable<MdxValue>[];

  getSeries(measure: string, seriesName?: string): number[];
  getSeriesGroup(measure: string): IMdxChartSeriesGroup;
}

export class MdxChart implements IMdxChart {
  constructor(
    readonly data: IMdxChartData,
    readonly measures: string[],
    readonly seriesNames: string[],
    readonly xAxis: NonNullable<MdxValue>[]
  ) {}

  filterMeasures(predicate: (measure: string, index: number, measures: string[]) => boolean): IMdxChartSelector {
    return new MdxChart(this.data, this.measures.filter(predicate), this.seriesNames, this.xAxis);
  }

  filterSeriesNames(predicate: (seriesName: string, index: number, seriesNames: string[]) => boolean): IMdxChartSelector {
    return new MdxChart(this.data, this.measures, this.seriesNames.filter(predicate), this.xAxis);
  }

  map<TSeries>(map: MapMdxSeriesDelegate<TSeries>): TSeries[] {
    return this.measures
      .map(m => {
        const seriesGroup = this.getSeriesGroup(m);
        return this.seriesNames.map(sn => {
          const series = this.getSeriesFromGroup(seriesGroup, sn);
          return map(series, sn, m);
        });
      })
      .reduce((a, b) => a.concat(b));
  }

  zip<TSeries>(map: ZipMdxSeriesDelegate<TSeries>): TSeries[] {
    return this.seriesNames.map(sn => {
      const data: number[][] = [];
      const seriesSet = this.measures.map(m => this.getSeries(m, sn));
      for (let index = 0; index < this.xAxis.length; index++) {
        const values = seriesSet.map(s => s[index]);
        data.push(values);
      }

      return map(data, sn, this.measures);
    });
  }

  getSeries(measure: string, seriesName: string = MdxMemberSet.Default): number[] {
    const seriesGroup = this.getSeriesGroup(measure);
    return this.getSeriesFromGroup(seriesGroup, seriesName);
  }

  getSeriesGroup(measure: string): IMdxChartSeriesGroup {
    const seriesGroup = this.data[measure];
    if (!seriesGroup) {
      throw Error(`Invalid measure ${measure}. It does not belong to the chart.`);
    }

    return seriesGroup;
  }

  private getSeriesFromGroup(seriesGroup: IMdxChartSeriesGroup, seriesName: string) {
    const series = seriesGroup[seriesName];
    if (!series) {
      const error =
        seriesName !== MdxMemberSet.Default
          ? `Invalid series group. It does not contain the series ${seriesName}.`
          : 'Invalid series group. It does not contain the default series.';

      throw Error(error);
    }

    return series;
  }
}
