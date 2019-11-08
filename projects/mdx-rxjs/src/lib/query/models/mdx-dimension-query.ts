import { IMdxQueryOptions } from './mdx-query-options';

export type MdxDimensionQueryType = 'all' | 'empty' | 'nonEmpty';
export interface IMdxDimensionQueryOptions extends IMdxQueryOptions {
  measures?: string[];
  type?: MdxDimensionQueryType;
}

export interface IMdxDimensionQuery extends IMdxDimensionQueryOptions {
  attributes: string[];
  measures?: string[];
  type?: MdxDimensionQueryType;
}
