export abstract class TabularMeasures {
  protected measure(name: string): string {
    return `[Measures].[${name}]`;
  }
}
