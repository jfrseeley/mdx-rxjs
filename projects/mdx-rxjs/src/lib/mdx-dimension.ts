export abstract class MdxDimension {
  constructor(private readonly dimension: string) {}

  protected attribute(name: string, hierarchy?: string): string {
    return hierarchy != null ? `[${this.dimension}].[${hierarchy}].[${name}]` : `[${this.dimension}].[${name}]`;
  }
}
