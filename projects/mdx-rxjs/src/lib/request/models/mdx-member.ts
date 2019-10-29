import { MdxValue } from '../../mdx-expressions';

export interface IMdxMember {
  isMeasure: boolean;
  levelExpression: string;
  levelNumber: number;
  caption: string | null;
  value: MdxValue;
}
