export interface IMdxVirtualRow<TRowCell, TExtendedProperties> {
  cells: TRowCell[];
  extendedProperties?: TExtendedProperties;
}
