import { IMdxQueryOptions } from './mdx-query.options';

export type MdxDimensionQueryType = 'all' | 'empty' | 'nonEmpty';
export interface IMdxDimensionQuery extends IMdxQueryOptions {
  attributes: string[];
  measures?: string[];
  type?: MdxDimensionQueryType;
}

export interface IMdxTableQuery extends IMdxQueryOptions {
  columns?: string[];
  measures?: string[];
  rows?: string[];
}
