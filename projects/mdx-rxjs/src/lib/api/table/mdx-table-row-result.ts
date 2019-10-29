export interface IMdxTableRowResult<TRow> {
  rows: TRow[];
  totals?: TRow;
  totalCount?: number;
}
