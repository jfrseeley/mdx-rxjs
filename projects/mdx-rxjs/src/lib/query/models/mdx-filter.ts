import { MdxComparisonOperator, MdxValue } from '../../mdx-expressions';

export interface IMdxFilter {
  levelExpression: string;
  comparisonOperator?: MdxComparisonOperator;
  comparisonValue?: MdxValue;
  includeAll?: boolean;
  memberKeys?: MdxValue[];
}
