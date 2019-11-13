import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import {
  Mdx,
  ProxyMdxHandler,
  SoapMdxHandler,
  MdxValue,
  MdxComparisonOperator,
  MdxSortExpression,
  IMdxFilter,
  IMdxOrderBy,
  IMdxQueryOptions,
  IMdxChartConfig
} from '../../projects/mdx-rxjs/src';
import { IMdxResponse } from '../../dist/mdx-rxjs';

interface IMdxFormData {
  cube: string;
  catalog: string;
  url: string;
  skip: number | null;
  top: number | null;
  filters: {
    levelExpression: string;
    comparisonOperator: string | null;
    comparisonValue: string | null;
    sortDirection: string | null;
    includeAll: boolean;
    includeTotalCount: boolean;
    memberKeys: string | null;
  }[];
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

  query = '';
  request = '';
  responseData = '';
  responseModel = '';

  private get mdxFormData(): IMdxFormData {
    return this.mdxForm.value;
  }

  private get mdxFormFilters(): FormArray {
    return this.mdxForm.get('filters') as FormArray;
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
      filters: this.formBuilder.array([])
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

  addFilter() {
    this.mdxFormFilters.push(
      this.formBuilder.group({
        levelExpression: ['', Validators.required],
        comparisonOperator: [null],
        comparisonValue: [null],
        sortDirection: [null],
        includeAll: [false],
        includeTotalCount: [false],
        memberKeys: [null]
      })
    );
  }

  removeFilter(index: number) {
    this.mdxFormFilters.removeAt(index);
  }

  loadChart() {
    const formData = this.chartFormData;
    const measures = formData.measures.split('\n');
    const options = this.getOptions();
    const config: IMdxChartConfig = {
      measures,
      xAxisLevelExpression: formData.xAxis,
      groupByLevelExpression: formData.groupBy ? formData.groupBy : undefined
    };

    this.showQuery({ config, options });
    this.createMdx()
      .getChartData(config, options)
      .subscribe(
        chart => this.showResponseModel(chart),
        error => this.showResponseModel(error)
      );
  }

  loadDimension() {
    const formData = this.dimensionFormData;
    const attributes = formData.attributes.split('\n');
    const measures = formData.measures ? formData.measures.split('\n') : undefined;
    const options = {
      ...this.getOptions(),
      measures
    };

    this.showQuery({ attributes, options });
    this.createMdx()
      .getDimensionData(attributes, options)
      .subscribe(
        result => this.showResponseModel(result),
        error => this.showResponseModel(error)
      );
  }

  loadTableRows() {
    const formData = this.tableRowFormData;
    const measures = formData.measures.split('\n');
    const rows = formData.rows.split('\n');
    const options = this.getOptions();

    this.showQuery({ measures, rows, options });
    this.createMdx()
      .getTableRowData(measures, rows, options)
      .subscribe(
        result => this.showResponseModel(result),
        error => this.showResponseModel(error)
      );
  }

  private createMdx(): Mdx {
    const formData = this.mdxFormData;
    return new Mdx(
      formData.cube,
      new ProxyMdxHandler(
        new SoapMdxHandler(formData.catalog, formData.url),
        mdxStatement => {
          this.showRequest(mdxStatement);
          return mdxStatement;
        },
        mdxResponse => {
          this.showResponseData(mdxResponse);
          return mdxResponse;
        }
      )
    );
  }

  private getOptions(): IMdxQueryOptions {
    const formData = this.mdxFormData;
    const filters: IMdxFilter[] = [];
    const orderBy: IMdxOrderBy[] = [];
    for (const rawFilter of formData.filters) {
      if (rawFilter.comparisonOperator || rawFilter.includeAll || rawFilter.includeTotalCount || rawFilter.memberKeys) {
        filters.push({
          levelExpression: rawFilter.levelExpression,
          comparisonOperator: rawFilter.comparisonOperator ? (rawFilter.comparisonOperator as MdxComparisonOperator) : undefined,
          comparisonValue: rawFilter.comparisonValue ? rawFilter.comparisonValue : undefined,
          includeAll: rawFilter.includeAll ? rawFilter.includeAll : undefined,
          includeTotalCount: rawFilter.includeTotalCount ? rawFilter.includeTotalCount : undefined,
          memberKeys: rawFilter.memberKeys ? rawFilter.memberKeys.split('\n') : undefined
        });
      }

      if (rawFilter.sortDirection) {
        orderBy.push({
          levelExpression: rawFilter.levelExpression,
          sortDirection: rawFilter.sortDirection.toLocaleUpperCase() as MdxSortExpression
        });
      }
    }

    return {
      filters: filters.length > 0 ? filters : undefined,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      skip: formData.skip != null ? formData.skip : undefined,
      top: formData.top != null ? formData.top : undefined
    };
  }

  private showQuery(value: any) {
    this.query = JSON.stringify(value, undefined, 2);
    this.request = 'Loading...';
    this.responseData = 'Loading...';
    this.responseModel = 'Loading...';
  }

  private showRequest(mdxStatement: string) {
    this.request = mdxStatement;
  }

  private showResponseData(mdxResponse: IMdxResponse) {
    this.responseData = JSON.stringify(mdxResponse, undefined, 2);
  }

  private showResponseModel(value: any) {
    if (value instanceof Error) {
      this.responseModel = value.message;
    } else {
      this.responseModel = JSON.stringify(value, undefined, 2);
    }
  }
}
