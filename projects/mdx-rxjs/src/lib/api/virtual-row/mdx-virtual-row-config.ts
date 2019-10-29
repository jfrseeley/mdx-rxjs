import { GetMdxVirtualRowCellDelegate } from './mdx-virtual-row';

export type MdxVirtualCellDefinition<TRowCell> = TRowCell | GetMdxVirtualRowCellDelegate<TRowCell>;
export type MdxVirtualRowDefinition<TRowCell> = MdxVirtualCellDefinition<TRowCell>[];

export interface IMdxVirtualRowConfig<TRowCell> {
  measures: string[];
  rows: MdxVirtualRowDefinition<TRowCell>[];
}
