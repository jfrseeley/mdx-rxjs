export interface IMdxVirtualRow<TRowCell, TExtendedProperties = any> {
  cells: TRowCell[];
  extendedProperties?: TExtendedProperties;
}
