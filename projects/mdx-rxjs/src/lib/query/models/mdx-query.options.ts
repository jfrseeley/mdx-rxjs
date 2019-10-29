import { IMdxFilter } from './mdx-filter';
import { IMdxOrderBy } from './mdx-order-by';

export interface IMdxFilterOptions {
  filters?: IMdxFilter[];
}

export interface IMdxSortOptions {
  orderBy?: IMdxOrderBy[];
  skip?: number;
  top?: number;
}

export interface IMdxQueryOptions extends IMdxFilterOptions, IMdxSortOptions {
  includeTotalCount?: boolean;
}
