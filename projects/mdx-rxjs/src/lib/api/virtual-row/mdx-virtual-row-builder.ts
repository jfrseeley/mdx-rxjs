import { IMdxFilter } from '../../query/models/mdx-filter';
import { MdxVirtualRowDefinition, IMdxVirtualRowConfig } from './mdx-virtual-row-config';
import { GetMdxVirtualRowCellDelegate, IMdxVirtualRow } from './mdx-virtual-row';
import { Observable } from 'rxjs';

export class MdxVirtualRowBuilder<TRowCell> implements IMdxVirtualRowConfig<TRowCell> {
  readonly measures: string[];
  readonly rows: MdxVirtualRowDefinition<TRowCell>[];

  constructor(private readonly factory: (config: MdxVirtualRowBuilder<TRowCell>, filters?: IMdxFilter[]) => Observable<TRowCell[][]>) {
    this.measures = [];
    this.rows = [];
  }

  addVirtualRow(setup: (row: IMdxVirtualRow<TRowCell>) => void): MdxVirtualRowBuilder<TRowCell> {
    const measures = this.measures;
    const rowDefinition: MdxVirtualRowDefinition<TRowCell> = [];
    this.rows.push(rowDefinition);

    const virtualRow: IMdxVirtualRow<TRowCell> = {
      addMeasureCell(measure: string, getRowCell: GetMdxVirtualRowCellDelegate<TRowCell>) {
        measures.push(measure);
        rowDefinition.push(getRowCell);
        return virtualRow;
      },
      addStaticCell(rowCell: TRowCell) {
        rowDefinition.push(rowCell);
        return virtualRow;
      }
    };

    setup(virtualRow);
    return this;
  }

  post(filters?: IMdxFilter[]): Observable<TRowCell[][]> {
    return this.factory(this, filters);
  }
}
