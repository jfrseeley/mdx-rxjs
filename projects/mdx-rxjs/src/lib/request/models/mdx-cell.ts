import { MdxValue } from '../../mdx-expressions';

export interface IMdxCell {
  value: MdxValue;
  valueFormatted: string | null;
}
