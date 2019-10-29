import { IMdxCell } from '../../request/models/mdx-cell';
import { IMdxMember } from '../../request/models/mdx-member';

export type GetMdxVirtualRowCellDelegate<TRowCell> = (data: IMdxCell, measure: IMdxMember) => TRowCell;
export interface IMdxVirtualRow<TRowCell> {
  addMeasureCell(measure: string, getRowCell: GetMdxVirtualRowCellDelegate<TRowCell>): IMdxVirtualRow<TRowCell>;
  addStaticCell(rowCell: TRowCell): IMdxVirtualRow<TRowCell>;
}
