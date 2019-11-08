import { IMdxOrderBy } from '../../mdx-types';

export interface IMdxSortOptions {
  orderBy?: IMdxOrderBy[];
  skip?: number;
  top?: number;
}
