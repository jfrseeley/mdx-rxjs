import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  Mdx,
  ProxyMdxHandler,
  SoapMdxHandler,
  MdxValue,
  MdxComparisonOperator,
  MdxSortExpression,
  IMdxFilter,
  IMdxOrderBy,
  IMdxQueryOptions
} from '../../projects/mdx-rxjs/src';

interface IMdxFormData {
  cube: string;
  catalog: string;
  url: string;
  skip: number | null;
  top: number | null;
  includeTotalCount: boolean;
  filters: string;
  orderBy: string;
}

interface IChartFormData {
  measures: string;
  xAxis: string;
  groupBy: string | null;
}

interface IDimensionFormData {
  attributes: string;
  measures: string | null;
}

interface ITableRowFormData {
  measures: string;
  rows: string;
}

const defaultAttribute = '[Dimension].[Level]';
const defaultMeasure = '[Measures].[Level]';
const defaultXAxis = '[Dimension].[Level]';

const comparisonRegex = /\s*([<>=]{1,2})\s*([a-zA-Z0-9() .,'/-])+$/i;
const includeAllRegex = /\.((?:children)|(?:members))$/i;
const memberKeyRegex = /&\[([a-zA-Z0-9() .,'/-]+)\]$/i;
const orderByRegex = / (B?(?:(?:ASC)|(?:DESC)))$/i;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  mdxForm: FormGroup;
  chartForm: FormGroup;
  dimensionForm: FormGroup;
  tableRowForm: FormGroup;

  request = '';
  response = '';

  private get mdxFormData(): IMdxFormData {
    return this.mdxForm.value;
  }

  private get chartFormData(): IChartFormData {
    return this.chartForm.value;
  }

  private get dimensionFormData(): IDimensionFormData {
    return this.dimensionForm.value;
  }

  private get tableRowFormData(): ITableRowFormData {
    return this.tableRowForm.value;
  }

  constructor(private formBuilder: FormBuilder) {
    this.mdxForm = this.formBuilder.group({
      cube: ['Model', Validators.required],
      catalog: ['Test', Validators.required],
      url: ['http://localhost/olap/', Validators.required],
      skip: [null],
      top: [null],
      includeTotalCount: [false],
      filters: [null],
      orderBy: [null]
    });

    this.chartForm = this.formBuilder.group({
      measures: [defaultMeasure, Validators.required],
      xAxis: [defaultXAxis, Validators.required],
      groupBy: [defaultAttribute]
    });
    this.dimensionForm = this.formBuilder.group({
      attributes: [defaultAttribute, Validators.required],
      measures: [defaultMeasure]
    });
    this.tableRowForm = this.formBuilder.group({
      measures: [defaultMeasure, Validators.required],
      rows: [defaultAttribute, Validators.required]
    });
  }

  loadChart() {
    const formData = this.chartFormData;
    const measures = formData.measures.split('\n');

    this.resetOutput();
    this.createMdx()
      .getChartData(
        {
          measures,
          xAxisLevelExpression: formData.xAxis,
          groupByLevelExpression: formData.groupBy ? formData.groupBy : undefined
        },
        this.getOptions()
      )
      .subscribe(chart => this.showResponse(chart), error => this.showResponse(error));
  }

  loadDimension() {
    const formData = this.dimensionFormData;
    const attributes = formData.attributes.split('\n');
    const measures = formData.measures ? formData.measures.split('\n') : undefined;

    this.resetOutput();
    this.createMdx()
      .getDimensionData(attributes, {
        ...this.getOptions(),
        measures
      })
      .subscribe(result => this.showResponse(result), error => this.showResponse(error));
  }

  loadTableRows() {
    const formData = this.tableRowFormData;
    const measures = formData.measures.split('\n');
    const rows = formData.rows.split('\n');

    this.resetOutput();
    this.createMdx()
      .getTableRowData(measures, rows, this.getOptions())
      .subscribe(result => this.showResponse(result), error => this.showResponse(error));
  }

  private createMdx(): Mdx {
    const formData = this.mdxFormData;
    return new Mdx(
      formData.cube,
      new ProxyMdxHandler(new SoapMdxHandler(formData.catalog, formData.url), mdxStatement => {
        this.request = mdxStatement;
      })
    );
  }

  private getOptions(): IMdxQueryOptions {
    const formData = this.mdxFormData;
    return {
      filters: formData.filters ? formData.filters.split('\n').map(raw => this.parseFilter(raw)) : undefined,
      orderBy: formData.orderBy ? formData.orderBy.split('\n').map(raw => this.parseOrderBy(raw)) : undefined,
      skip: formData.skip ? formData.skip : undefined,
      top: formData.top ? formData.top : undefined,
      includeTotalCount: formData.includeTotalCount
    };
  }

  private parseFilter(raw: string): IMdxFilter {
    let comparisonOperator: MdxComparisonOperator | undefined;
    let comparisonValue: MdxValue | undefined;
    let includeAll: boolean | undefined;
    let memberKeys: MdxValue[] | undefined;

    let regexResult = comparisonRegex.exec(raw);
    if (regexResult) {
      raw = raw.substring(0, raw.length - regexResult[0].length);
      comparisonOperator = regexResult[1] as MdxComparisonOperator;
      comparisonValue = regexResult[2];
    }

    regexResult = memberKeyRegex.exec(raw);
    if (regexResult) {
      raw = raw.substring(0, raw.length - regexResult[0].length);
      memberKeys = [regexResult[1]];
    }

    regexResult = includeAllRegex.exec(raw);
    if (regexResult) {
      raw = raw.substring(0, raw.length - regexResult[0].length);
      switch (regexResult[1]) {
        case 'children':
          includeAll = false;
          break;
        case 'members':
          includeAll = true;
          break;
        default:
          const error = `Invalid filter expression ${raw}`;
          this.request = error;
          this.response = '';

          throw Error(error);
      }
    }

    return {
      levelExpression: raw,
      comparisonOperator,
      comparisonValue,
      includeAll,
      memberKeys
    };
  }

  private parseOrderBy(raw: string): IMdxOrderBy {
    let sortDirection: MdxSortExpression | undefined;

    const regexResult = orderByRegex.exec(raw);
    if (regexResult) {
      raw = raw.substring(0, raw.length - regexResult[0].length);
      sortDirection = regexResult[1].toLocaleUpperCase() as MdxSortExpression;
    }

    return {
      levelExpression: raw,
      sortDirection
    };
  }

  private resetOutput() {
    this.request = 'Loading...';
    this.response = 'Loading...';
  }

  private showResponse(value: any) {
    this.response = JSON.stringify(value, undefined, 2);
  }
}
