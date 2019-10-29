import { MdxSortExpression } from '../../mdx-expressions';

export interface IMdxOrderBy {
  levelExpression: string;
  sortDirection?: MdxSortExpression;
}
