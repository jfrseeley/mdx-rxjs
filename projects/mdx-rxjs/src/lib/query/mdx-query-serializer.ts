import { MdxLevelExpression, MdxMemberExpression, MdxSetExpression } from '../mdx-expressions';
import { IMdxSortOptions } from './models/mdx-query.options';
import { IMdxDimensionQuery, IMdxTableQuery } from './models/mdx-query';
import { MdxExpressionFactory } from './mdx-expression-factory';
import { MdxQueryBuilder } from './mdx-query-builder';

export class MdxQuerySerializer {
  constructor(private readonly cube: string) {}

  serializeDimensionQuery(query: IMdxDimensionQuery): string {
    const attributes = query.attributes != null ? MdxLevelExpression.fromAttributes(query.attributes) : [];
    const measures = query.measures != null ? MdxLevelExpression.fromMeasures(query.measures) : [];
    if (attributes.length === 0) {
      throw Error('Invalid dimension query. At least one attribute must be specified.');
    }

    const attributeKey = '[queryAttributes]';
    const measureKey = '[queryMeasures]';
    const isNonEmptyKey = '[Measures].[_isNonEmpty]';

    const isNonEmpty = new MdxMemberExpression(isNonEmptyKey);
    let columnAxis = isNonEmpty.asSet();
    let rowAxis = new MdxSetExpression(attributeKey);

    const attributesWithOrderBy = MdxLevelExpression.fromAttributes(this.getAttributesWithOrderBy(query.attributes, query));
    let shouldExtract = attributesWithOrderBy.length > attributes.length;

    const factory = new MdxExpressionFactory(attributesWithOrderBy, query);
    const queryBuilder = new MdxQueryBuilder(this.cube);
    if (measures.length > 0) {
      const measureSet = new MdxSetExpression(measureKey);
      shouldExtract = true;
      queryBuilder
        .defineSet(attributeKey, factory.createSetFromAttributes(attributesWithOrderBy))
        .defineSet(measureKey, MdxSetExpression.fromMeasures(measures))
        .defineMember(
          isNonEmptyKey,
          measureSet
            .count(true)
            .equalTo(0)
            .iif(0, 1),
          'Is Non-Empty'
        );

      rowAxis = rowAxis.crossJoin(measureSet);
      if (query.type) {
        switch (query.type) {
          case 'all':
            break;
          case 'empty':
            rowAxis = rowAxis.filter(isNonEmpty.equalTo(0));
            break;
          case 'nonEmpty':
            rowAxis = rowAxis.filter(isNonEmpty.equalTo(1));
            break;
          default:
            throw new Error(`Invalid dimension query type ${query.type}.`);
        }
      }
    } else {
      queryBuilder
        .defineSet(attributeKey, factory.createSetFromAttributes(attributesWithOrderBy))
        .defineMember(isNonEmptyKey, 1, 'Is Non-Empty');
    }

    if (query.includeTotalCount) {
      columnAxis = this.defineTotalCount(queryBuilder, columnAxis, rowAxis);
    }

    rowAxis = factory.extendSetWithSortOptions(rowAxis, query);
    if (shouldExtract) {
      rowAxis = rowAxis.extract(...attributes);
    }

    return queryBuilder
      .onColumns(columnAxis)
      .onRows(rowAxis)
      .filterByQueryAxis(factory.getQueryAxis())
      .filterBySlicerAxis(factory.getSlicerAxis())
      .toStatement();
  }

  serializeTableQuery(query: IMdxTableQuery): string {
    const columns = query.columns != null ? MdxLevelExpression.fromAttributes(query.columns) : [];
    const measures = query.measures != null ? MdxLevelExpression.fromMeasures(query.measures) : [];
    const rows = query.rows != null ? MdxLevelExpression.fromAttributes(query.rows) : [];

    const columnKey = '[queryColumns]';
    const measureKey = '[queryMeasures]';
    let columnAxis: MdxSetExpression;

    const factory = new MdxExpressionFactory(columns.concat(rows), query);
    const queryBuilder = new MdxQueryBuilder(this.cube);
    if (columns.length > 0 && measures.length > 0) {
      queryBuilder
        .defineSet(measureKey, MdxSetExpression.fromMeasures(measures))
        .defineSet(columnKey, factory.createSetFromAttributes(columns).nonEmpty(measureKey));

      columnAxis = new MdxSetExpression(columnKey).crossJoin(measureKey);
    } else if (columns.length > 0) {
      queryBuilder.defineSet(columnKey, factory.createSetFromAttributes(columns));
      columnAxis = new MdxSetExpression(columnKey);
    } else if (measures.length > 0) {
      queryBuilder.defineSet(measureKey, MdxSetExpression.fromMeasures(measures));
      columnAxis = new MdxSetExpression(measureKey);
    } else {
      throw Error('Invalid table query. At least one column or measure must be specified.');
    }

    if (rows.length > 0) {
      const rowKey = '[queryRows]';
      const rowAxis = new MdxSetExpression(rowKey);
      queryBuilder.defineSet(
        rowKey,
        factory.createSetFromSortOptions(rows, query, lowestInclusiveSet => {
          const rowSet = measures.length > 0 ? lowestInclusiveSet.nonEmpty(measureKey) : lowestInclusiveSet;
          if (query.includeTotalCount) {
            columnAxis = this.defineTotalCount(queryBuilder, columnAxis, rowSet);
          }

          return rowSet;
        })
      );

      queryBuilder.onColumns(columnAxis).onRows(rowAxis);
    } else {
      columnAxis = factory.extendSetWithSortOptions(columnAxis, query);
      queryBuilder.onColumns(columnAxis);
    }

    return queryBuilder
      .filterByQueryAxis(factory.getQueryAxis())
      .filterBySlicerAxis(factory.getSlicerAxis())
      .toStatement();
  }

  private defineTotalCount(queryBuilder: MdxQueryBuilder, columnAxis: MdxSetExpression, rowAxis: MdxSetExpression): MdxSetExpression {
    const totalCount = new MdxMemberExpression('[Measures].[_totalCount]');
    queryBuilder.defineMember(totalCount.expression, rowAxis.count(), 'Total Count');

    return columnAxis.union(totalCount.asSet());
  }

  private getAttributesWithOrderBy(attributes: string[], options: IMdxSortOptions): string[] {
    return options.orderBy ? Array.from(new Set<string>(attributes.concat(options.orderBy.map(x => x.levelExpression)))) : attributes;
  }
}
