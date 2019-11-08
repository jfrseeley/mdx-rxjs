import { MdxValue } from '../../mdx-types';

export interface IMdxMember {
  isMeasure: boolean;
  levelExpression: string;
  levelNumber: number;
  caption: string | null;
  value: MdxValue;
}
