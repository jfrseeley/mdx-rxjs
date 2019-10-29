import { MdxSetType, MdxValueType } from '../mdx-expressions';

const cellProperties = 'CELL PROPERTIES VALUE, FORMATTED_VALUE';
const dimensionProperties = 'DIMENSION PROPERTIES MEMBER_VALUE';

export class MdxQueryBuilder {
  private columnAxis: MdxSetType | null = null;
  private rowAxis: MdxSetType | null = null;

  private queryAxis: MdxSetType | null = null;
  private slicerAxis: MdxSetType | null = null;

  private readonly scope: string[] = [];

  constructor(private readonly cube: string) {}

  defineMember(name: string, value: MdxValueType, caption?: string): MdxQueryBuilder {
    this.scope.push(caption ? `MEMBER ${name} AS ${value}, CAPTION = '${caption}'` : `MEMBER ${name} AS ${value}`);
    return this;
  }

  defineSet(name: string, set: MdxSetType): MdxQueryBuilder {
    this.scope.push(`SET ${name} AS ${set}`);
    return this;
  }

  filterByQueryAxis(set: MdxSetType | null) {
    this.queryAxis = set;
    return this;
  }

  filterBySlicerAxis(set: MdxSetType | null) {
    this.slicerAxis = set;
    return this;
  }

  onColumns(set: MdxSetType | null): MdxQueryBuilder {
    this.columnAxis = set;
    return this;
  }

  onRows(set: MdxSetType | null): MdxQueryBuilder {
    this.rowAxis = set;
    return this;
  }

  onPages(set: MdxSetType | null): MdxQueryBuilder {
    throw new Error('The page axis is not yet supported.');
  }

  toStatement(): string {
    const select = this.getSelectStatement();
    const from = this.getFromStatement();
    const where = this.getWhereStatement();
    return where
      ? ['WITH', ...this.scope, select, from, where, cellProperties].join('\r\n')
      : ['WITH', ...this.scope, select, from, cellProperties].join('\r\n');
  }

  private getSelectStatement() {
    if (!this.columnAxis) {
      throw new Error(`Invalid select statement. Column axis must be specified.`);
    }

    const columns = `${this.columnAxis} ${dimensionProperties} ON COLUMNS`;
    const rows = this.rowAxis ? `${this.rowAxis} ${dimensionProperties} ON ROWS` : null;

    return rows ? `SELECT ${columns}, ${rows}` : `SELECT ${columns}`;
  }

  private getFromStatement(): string {
    return this.queryAxis ? `FROM (SELECT ${this.queryAxis} ON COLUMNS FROM [${this.cube}])` : `FROM [${this.cube}]`;
  }

  private getWhereStatement(): string | null {
    return this.slicerAxis ? `WHERE (${this.slicerAxis})` : null;
  }
}
