export type MdxValue = string | number | null;
export type MdxExpressionTransform<TDto> = { [P in keyof TDto]: string };

export type MdxComparisonOperator = '<' | '<=' | '<>' | '=' | '>' | '>=';
export type MdxSortExpression = 'ASC' | 'DESC' | 'BASC' | 'BDESC';

export interface IMdxFilter {
  levelExpression: string;
  comparisonOperator?: MdxComparisonOperator;
  comparisonValue?: MdxValue;
  includeAll?: boolean;
  includeTotalCount?: boolean;
  memberKeys?: MdxValue[];
}

export interface IMdxOrderBy {
  levelExpression: string;
  sortDirection?: MdxSortExpression;
}

export abstract class MdxDimension {
  constructor(private readonly dimension: string) {}

  protected attribute(name: string, hierarchy?: string): string {
    return hierarchy != null ? `[${this.dimension}].[${hierarchy}].[${name}]` : `[${this.dimension}].[${name}]`;
  }
}

export abstract class MdxMeasures {
  protected measure(name: string): string {
    return `[Measures].[${name}]`;
  }
}
