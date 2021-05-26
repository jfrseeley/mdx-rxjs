import { MdxValue } from '../../mdx-types';

export interface IMdxVirtualRow<TRowCell = MdxValue, TExtendedProperties = void> {
  cells: TRowCell[];
  extendedProperties?: TExtendedProperties;
}
