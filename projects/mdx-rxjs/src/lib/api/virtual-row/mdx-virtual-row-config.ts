import { GetMdxVirtualRowCellDelegate } from './mdx-virtual-row-builder';

export type MdxVirtualCellDefinition<TRowCell> = TRowCell | GetMdxVirtualRowCellDelegate<TRowCell>;
export interface IMdxVirtualRowDefinition<TRowCell, TExtendedProperties = any> {
  cells: MdxVirtualCellDefinition<TRowCell>[];
  extendedProperties?: TExtendedProperties;
}

export interface IMdxVirtualRowConfig<TRowCell, TExtendedProperties = any> {
  measures: string[];
  rows: IMdxVirtualRowDefinition<TRowCell, TExtendedProperties>[];
}
