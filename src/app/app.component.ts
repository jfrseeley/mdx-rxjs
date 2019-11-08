import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Mdx, SoapMdxHandler } from '../../projects/mdx-rxjs/src';

interface IMdxFormData {
  cube: string;
  catalog: string;
  url: string;
}

interface IChartFormData {
  measures: string;
  xAxis: string;
  groupBy?: string;
}

interface IDimensionFormData {
  attributes: string;
  measures?: string;
}

interface ITableRowFormData {
  measures: string;
  rows: string;
}

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

  constructor(private formBuilder: FormBuilder) {
    this.mdxForm = this.formBuilder.group({
      cube: 'Model',
      catalog: 'Test',
      url: 'http://localhost/olap/'
    });

    this.chartForm = this.formBuilder.group({
      measures: ['', Validators.required],
      xAxis: ['', Validators.required],
      groupBy: ['']
    });
    this.dimensionForm = this.formBuilder.group({
      attributes: ['', Validators.required],
      measures: ['']
    });
    this.tableRowForm = this.formBuilder.group({
      measures: ['', Validators.required],
      rows: ['', Validators.required]
    });
  }

  loadChart() {
    const data: IChartFormData = this.chartForm.value;
    const measures = data.measures.split('\n');

    this.createMdx()
      .getChartData({
        measures,
        xAxisLevelExpression: data.xAxis,
        groupByLevelExpression: data.groupBy
      })
      .subscribe(
        chart => {
          console.log(chart);
        },
        error => {
          console.error(error);
        }
      );
  }

  loadDimension() {
    const data: IDimensionFormData = this.dimensionForm.value;
    const attributes = data.attributes.split('\n');
    const measures = data.measures ? data.measures.split('\n') : undefined;

    this.createMdx()
      .getDimensionData(attributes, {
        measures
      })
      .subscribe(
        result => {
          console.log(result);
        },
        error => {
          console.error(error);
        }
      );
  }

  loadTableRows() {
    const data: ITableRowFormData = this.tableRowForm.value;
    const measures = data.measures.split('\n');
    const rows = data.rows.split('\n');
    this.createMdx()
      .getTableRowData(measures, rows)
      .subscribe(
        result => {
          console.log(result);
        },
        error => {
          console.error(error);
        }
      );
  }

  private createMdx(): Mdx {
    const data: IMdxFormData = this.mdxForm.value;
    return new Mdx(data.cube, new SoapMdxHandler(data.catalog, data.url));
  }
}
