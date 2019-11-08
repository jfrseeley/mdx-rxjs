import { MdxValue } from '../../mdx-types';

export interface IMdxCell {
  value: MdxValue;
  valueFormatted: string | null;
}
