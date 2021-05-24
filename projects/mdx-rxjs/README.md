# mdx-rxjs

API for posting multidimensional expression (MDX) queries using rxjs.

## Initializing the API

### Create an Instance

```
const cube = 'SomeCube';
const catalog = 'SomeCatalog';
const url = 'http://localhost/olap/';

const mdx = new Mdx(cube, new SoapMdxHandler(catalog, url));
```

### As an Angular Service

```
@Injectable()
export class MdxService extends Mdx {
    constructor() {
        const cube = 'SomeCube';
        const catalog = 'SomeCatalog';
        const url = 'http://localhost/olap/';

        super(cube, new SoapMdxHandler(catalog, url));
    }
}
```

## Tables

One basic use case for MDX queries could be measuring specific facts across one or more dimensions (a.k.a. tables), but still on two axes. Two variations exist for this, `getTableRowData` and `getTableRowDtos`. They can both be used to serve the same purpose, but the DTO variation allows you to type your rows using an interface.

See the below examples for some vanilla scenarios:

### Get Table Row Data

```
const someStringAttributeExpression = '[SomeDimension].[SomeString]';
const someNumberAttributeExpression = '[SomeDimension].[SomeNumber]';
const rows = [
  someStringAttributeExpression,
  someNumberAttributeExpression
];

const someMeasureExpressionA = '[Measures].[SomeMeasureA]';
const someMeasureExpressionB = '[Measures].[SomeMeasureB]';
const measures = [
  someMeasureExpressionA,
  someMeasureExpressionB
];

mdx.getTableRowData(measures, rows)
  .subscribe(result => {
    const someStrings = result.rows.map(r => r[someStringAttributeExpression] as string);
    const someNumbers = result.rows.map(r => r[someNumberAttributeExpression] as number);

    const measuresA = result.rows.map(r => r[someMeasureExpressionA] as number);
    const measuresB = result.rows.map(r => r[someMeasureExpressionB] as number);
  });
```

### Get Table Rows as DTOs

```
interface SomePivot {
  someString: string;
  someNumber: number;

  someMeasureA: number;
  someMeasureB: number;
}

mdx
  .getTableRowDtos<SomePivot>({
    someString: '[SomeDimension].[SomeString]',
    someNumber: '[SomeDimension].[SomeNumber]',

    someMeasureA: '[Measures].[SomeMeasureA]',
    someMeasureB: '[Measures].[SomeMeasureB]'
  })
  .subscribe(result => {
    const someStrings = result.rows.map(r => r.someString);
    const someNumbers = result.rows.map(r => r.someNumber);

    const measuresA = result.rows.map(r => r.someMeasureA);
    const measuresB = result.rows.map(r => r.someMeasureB);
  });
```

## Advanced Querying

Both of the above table functions allow you to provide optional `options` parameters of type `IMdxQueryOptions`. These can be used for more advanced scenarios to further qualify the query and/or slicer axis.

Most of these options are also available to other functions as optional parameters.

### Filter Options

- levelExpression: The level expression of the attribute or measure.
- comparisonOperator?: The operator to be used for comparison in the slicer axis. Must be used in conjunction with the `comparisonValue`. Possible values include:
  - '<'
  - '<='
  - '<>'
  - '='
  - '>'
  - '>='
- comparisonValue?: The value to be used for comparison in the slicer axis. Must be used in conjunction with the `comparisonOperator`.
- includeAllAggregation?: Whether or not to include all members (which includes the total aggregation), or just the children. Default: `false`.
- includeInTotalCount?: Whether or not to include the attribute or measure in the total count. If none are included, the total count will not be calculated. Default `false`.
- memberKeys?: Specific values to be selected from the slicer axis. Mutually exclusive with `includeAllAggregation`.

### Sort Options

- orderBy?: An array of level expressions and sort directions.
  - levelExpression: The level expression of the attribute or measure.
  - sortDirection?: The sort direction, including whether or not to break hierarchy. Possible values include:
    - 'ASC'
    - 'DESC'
    - 'BASC'
    - 'BDESC'
- skip?: How many rows to skip from the result.
- top?: How many rows to include in the result.

## Virtual Tables (Measures Only)

Another use case of tables may be when you have facts to measure, but don't want to pivot them against any dimensions for that second axis. For this, call `getVirtualTableBuilder` to queue up some measures under some virtual arrangement, and then `post` it for their results.

### Get Virtual Table Rows

```
const tableBuilder = mdx.getVirtualTableBuilder<MdxValue>();
tableBuilder.addVirtualRow(row =>
  row
    .addStaticCell('Row 1')
    .addMeasureCell('[Measures].[SomeMeasureA]', data => data.value)
    .addMeasureCell('[Measures].[SomeMeasureB]', data => data.value)
    .addMeasureCell('[Measures].[SomeMeasureC]', data => data.value)
);

tableBuilder.addVirtualRow(row =>
  row
    .addStaticCell('Row 2')
    .addMeasureCell('[Measures].[SomeMeasureD]', data => data.value)
    .addMeasureCell('[Measures].[SomeMeasureE]', data => data.value)
    .addMeasureCell('[Measures].[SomeMeasureF]', data => data.value)
);

tableBuilder.post().subscribe(rows => {
  const staticCell1 = rows[0].cells[0];
  const measureA = rows[0].cells[1];
  const measureB = rows[0].cells[2];
  const measureC = rows[0].cells[3];

  const staticCell2 = rows[1].cells[0];
  const measureD = rows[1].cells[1];
  const measureE = rows[1].cells[2];
  const measureF = rows[1].cells[3];
});
```

## Dimensions

To query just your dimensions, consider the counterparts `getDimensionData` and `getDimensionDtos`. Just as for tables, the DTO variation allows you to type your dimension using an interface.

See the vanilla examples below:

### Get Dimension Data

```
const someStringAttributeExpression = '[SomeDimension].[SomeString]';
const someNumberAttributeExpression = '[SomeDimension].[SomeNumber]';

mdx.getDimensionData([
    someStringAttributeExpression,
    someNumberAttributeExpression
  ])
  .subscribe(result => {
    const someStrings = result.rows.map(r => r.data[someStringAttributeExpression] as string);
    const someNumbers = result.rows.map(r => r.data[someNumberAttributeExpression] as number);
  });
```

### Get Dimensions as DTOs

```
interface SomeDimension {
  someString: string;
  someNumber: number;
}

mdx
  .getDimensionDtos<SomeDimension>({
    someString: '[SomeDimension].[SomeString]',
    someNumber: '[SomeDimension].[SomeNumber]'
  })
  .subscribe(result => {
    const someStrings = result.rows.map(r => r.data.someString);
    const someNumbers = result.rows.map(r => r.data.someNumber);
  });
```

### Dimension Options

In addition to the filter and sorting options used for tables, dimension queries can also be qualified with the below:

- measures?: An array of level expressions by which to measure the `isNonEmpty` property that's returned with each row.
- type?: An indicator that determines the behavior followed when defining `measures`. Possible values include:
  - 'all'
  - 'empty'
  - 'nonEmpty'

## Charts

In order to make it easy to adapt data to charts, the `getChartData` function was also provided, including a few new config options. This can be used when you want to keep your measures apart in distinct series of data. Conversely, if you need to represent them as series _and_ tables, take a look at the `zip` function on the returned chart.

Here's the vanilla example:

### Get Chart Data

```
interface Series {
  type: string;
  data: number[];
  name: string;
  measure: string;
}

const someMeasureExpressionA = '[Measures].[SomeMeasureA]';
const someMeasureExpressionB = '[Measures].[SomeMeasureB]';

mdx
  .getChartData({
    measures: [someMeasureExpressionA, someMeasureExpressionB],
    xAxisLevelExpression: '[SomeDimension].[SomeString]'
  })
  .subscribe(chart => {
    const lines = chart.map<Series>((data, name, measure) => ({
      type: 'line',
      data: data,
      name: name,
      measure: measure
    }));
  });
```

### Chart Config

- measures: The measures that will expand across the y-axis.
- xAxisLevelExpression: The attribute that will expand across the x-axis. This will also determine the name of each series.
- groupByLevelExpression?: The dimension by which to group individual series within a series group.
