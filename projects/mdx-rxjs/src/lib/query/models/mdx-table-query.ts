import { IMdxQueryOptions } from './mdx-query-options';

export interface IMdxTableQuery extends IMdxQueryOptions {
  columns?: string[];
  measures?: string[];
  rows?: string[];
}
