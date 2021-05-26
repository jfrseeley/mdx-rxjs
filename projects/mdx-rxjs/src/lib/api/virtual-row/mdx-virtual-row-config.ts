import { MdxValue } from '../../mdx-types';
import { GetMdxVirtualRowCellDelegate } from './mdx-virtual-row-builder';

export type MdxVirtualCellDefinition<TRowCell = MdxValue> = TRowCell | GetMdxVirtualRowCellDelegate<TRowCell>;
export interface IMdxVirtualRowDefinition<TRowCell = MdxValue, TExtendedProperties = void> {
  cells: MdxVirtualCellDefinition<TRowCell>[];
  extendedProperties?: TExtendedProperties;
}

export interface IMdxVirtualRowConfig<TRowCell = MdxValue, TExtendedProperties = void> {
  measures: string[];
  rows: IMdxVirtualRowDefinition<TRowCell, TExtendedProperties>[];
}
