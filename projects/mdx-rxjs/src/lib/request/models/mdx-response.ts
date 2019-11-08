import { MdxValue } from '../../mdx-types';
import { IMdxAxis } from './mdx-axis';
import { IMdxCell } from './mdx-cell';

export interface IMdxResponse {
  axes: IMdxAxis[];
  cellData: IMdxCell[];

  getColumnAxis(): IMdxAxis;
  getRowAxis(): IMdxAxis;

  getCell(index: number): IMdxCell;
  getCellValue(index: number): MdxValue;
}

export class MdxResponse implements IMdxResponse {
  constructor(readonly axes: IMdxAxis[], readonly cellData: IMdxCell[]) {}

  getColumnAxis(): IMdxAxis {
    const axis = this.axes[0];
    if (!axis) {
      throw Error(`Column axis is undefined (${JSON.stringify(this.getCountData())}).`);
    }

    return axis;
  }

  getRowAxis(): IMdxAxis {
    const axis = this.axes[1];
    if (!axis) {
      throw Error(`Row axis is undefined (${JSON.stringify(this.getCountData())}).`);
    }

    return axis;
  }

  getCell(index: number): IMdxCell {
    const cell = this.cellData[index];
    if (!cell) {
      throw Error(`Cell at index ${index} is undefined (${JSON.stringify(this.getCountData())}).`);
    }

    return cell;
  }

  getCellValue(index: number): MdxValue {
    return this.getCell(index).value;
  }

  private getCountData() {
    let index = 0;
    const axes = this.axes.map(a => {
      const memberCounts = Array.from(new Set<number>(a.tuples.map(t => t.members.length))).sort();
      return {
        axisNumber: index++,
        tupleCount: a.tuples.length,
        maxMemberCount: memberCounts.length > 0 ? memberCounts[memberCounts.length - 1] : 0,
        minMemberCount: memberCounts.length > 0 ? memberCounts[0] : 0
      };
    });

    return {
      axes,
      axisCount: this.axes.length,
      cellCount: this.cellData.length
    };
  }
}
