import { IMdxFilter } from '../../mdx-types';
import { MdxVirtualRowBuilder } from './mdx-virtual-row-builder';
import { IMdxVirtualRowConfig } from './mdx-virtual-row-config';
import { IMdxVirtualRow } from './mdx-virtual-row';
import { Observable } from 'rxjs';

export class MdxVirtualTableBuilder<TRowCell, TExtendedProperties> implements IMdxVirtualRowConfig<TRowCell, TExtendedProperties> {
  readonly measures: string[];
  readonly rows: MdxVirtualRowBuilder<TRowCell, TExtendedProperties>[];

  constructor(
    private readonly factory: (
      config: MdxVirtualTableBuilder<TRowCell, TExtendedProperties>,
      filters?: IMdxFilter[]
    ) => Observable<IMdxVirtualRow<TRowCell, TExtendedProperties>[]>
  ) {
    this.measures = [];
    this.rows = [];
  }

  addVirtualRow(
    setup: (row: MdxVirtualRowBuilder<TRowCell, TExtendedProperties>) => void,
    extendedProperties?: TExtendedProperties
  ): MdxVirtualTableBuilder<TRowCell, TExtendedProperties> {
    const row = new MdxVirtualRowBuilder(this, extendedProperties);
    this.rows.push(row);

    setup(row);
    return this;
  }

  post(filters?: IMdxFilter[]): Observable<IMdxVirtualRow<TRowCell, TExtendedProperties>[]> {
    return this.factory(this, filters);
  }
}
