export interface IMdxTableRowResult<TRow> {
  rows: TRow[];
  totals: TRow | null;
  totalCount: number | null;
}
