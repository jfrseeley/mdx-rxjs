import { MdxValue } from '../../mdx-types';
import { IMdxCell } from '../../request/models/mdx-cell';
import { IMdxMember } from '../../request/models/mdx-member';
import { MdxVirtualCellDefinition, IMdxVirtualRowDefinition } from './mdx-virtual-row-config';
import { MdxVirtualTableBuilder } from './mdx-virtual-table-builder';

export type GetMdxVirtualRowCellDelegate<TRowCell = MdxValue> = (data: IMdxCell, measure: IMdxMember) => TRowCell;
export class MdxVirtualRowBuilder<TRowCell = MdxValue, TExtendedProperties = void>
  implements IMdxVirtualRowDefinition<TRowCell, TExtendedProperties>
{
  readonly cells: MdxVirtualCellDefinition<TRowCell>[] = [];

  constructor(
    private readonly table: MdxVirtualTableBuilder<TRowCell, TExtendedProperties>,
    readonly extendedProperties?: TExtendedProperties
  ) {}

  addMeasureCell(measure: string, getRowCell: GetMdxVirtualRowCellDelegate<TRowCell>): MdxVirtualRowBuilder<TRowCell, TExtendedProperties> {
    this.table.measures.push(measure);
    this.cells.push(getRowCell);
    return this;
  }

  addStaticCell(rowCell: TRowCell): MdxVirtualRowBuilder<TRowCell, TExtendedProperties> {
    this.cells.push(rowCell);
    return this;
  }
}
