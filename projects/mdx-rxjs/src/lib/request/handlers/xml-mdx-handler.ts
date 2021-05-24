import { Observable } from 'rxjs';
import { MdxValue } from '../../mdx-types';
import { IMdxHandler } from './mdx-handler';
import { IMdxAxis, MdxAxis } from '../models/mdx-axis';
import { IMdxCell } from '../models/mdx-cell';
import { IMdxMember } from '../models/mdx-member';
import { IMdxResponse, MdxResponse } from '../models/mdx-response';
import { IMdxTuple, MdxTuple } from '../models/mdx-tuple';

export abstract class XmlMdxHandler implements IMdxHandler {
  public abstract post(mdxStatement: string): Observable<IMdxResponse>;

  protected deserializeResponse(rootNode: Element): IMdxResponse {
    let axesNode: Element | null = null;
    let cellDataNode: Element | null = null;

    rootNode.childNodes.forEach((childNode: Element) => {
      switch (childNode.nodeName) {
        case 'Axes':
          axesNode = childNode;
          break;
        case 'CellData':
          cellDataNode = childNode;
          break;
      }
    });

    if (axesNode == null || cellDataNode == null) {
      throw Error('Invalid table response. The axes and cell data nodes must be specified.');
    }

    const axes = this.deserializeAxes(axesNode);
    const columnCount = axes.length > 0 ? axes[0].tuples.length : 0;
    const rowCount = axes.length > 1 ? axes[1].tuples.length : 1;

    const cellCount = columnCount * rowCount;
    const cellData = this.deserializeCellData(cellDataNode, cellCount);
    return new MdxResponse(axes, cellData);
  }

  private deserializeAxes(axesNode: Element): IMdxAxis[] {
    const axes: IMdxAxis[] = [];
    axesNode.childNodes.forEach((childNode: Element) => {
      if (childNode.nodeName === 'Axis') {
        const nameAttribute = childNode.attributes.getNamedItem('name');
        if (nameAttribute && nameAttribute.value !== 'SlicerAxis') {
          axes.push(this.deserializeAxis(childNode));
        }
      }
    });

    return axes;
  }

  private deserializeAxis(axisNode: Element): IMdxAxis {
    const tuples: IMdxTuple[] = [];
    axisNode.childNodes.forEach((childNode: Element) => {
      if (childNode.nodeName === 'Tuples') {
        childNode.childNodes.forEach((grandchildNode: Element) => {
          if (grandchildNode.nodeName === 'Tuple') {
            tuples.push(this.deserializeTuple(grandchildNode));
          }
        });
      }
    });

    return new MdxAxis(tuples);
  }

  private deserializeCell(cellNode: Element): IMdxCell {
    let value: MdxValue = null;
    let valueFormatted: string | null = null;

    cellNode.childNodes.forEach((propertyNode: Element) => {
      const rawValue = propertyNode.textContent;
      if (rawValue != null) {
        switch (propertyNode.nodeName) {
          case 'Value':
            value = this.parseValue(propertyNode, rawValue);
            break;
          case 'FmtValue':
            valueFormatted = rawValue;
            break;
        }
      }
    });

    return {
      value,
      valueFormatted,
    };
  }

  private deserializeCellData(cellDataNode: Element, cellCount: number): IMdxCell[] {
    const cells: IMdxCell[] = [];
    cellDataNode.childNodes.forEach((childNode: Element) => {
      if (childNode.nodeName === 'Cell') {
        const cellOrdinalAttribute = childNode.attributes.getNamedItem('CellOrdinal');
        const cellOrdinal = cellOrdinalAttribute ? Number(cellOrdinalAttribute.value) : -1;
        while (cellOrdinal > cells.length) {
          cells.push({
            value: null,
            valueFormatted: null,
          });
        }

        cells.push(this.deserializeCell(childNode));
      }
    });

    let trailingEmptyCellCount = cellCount - cells.length;
    while (trailingEmptyCellCount-- > 0) {
      cells.push({
        value: null,
        valueFormatted: null,
      });
    }

    return cells;
  }

  private deserializeMember(memberNode: Element): IMdxMember {
    const hierarchyAttribute = memberNode.attributes.getNamedItem('Hierarchy');
    const hierarchyName = hierarchyAttribute ? hierarchyAttribute.value : null;

    let uniqueName: string | null = null;
    let levelName: string | null = null;

    const member = { caption: null, value: null } as IMdxMember;
    memberNode.childNodes.forEach((propertyNode: Element) => {
      const rawValue = propertyNode.textContent;
      if (rawValue) {
        switch (propertyNode.nodeName) {
          case 'UName':
            uniqueName = rawValue;
            break;
          case 'Caption':
            member.caption = rawValue;
            break;
          case 'LName':
            levelName = rawValue;
            break;
          case 'LNum':
            member.levelNumber = Number(rawValue);
            break;
          case 'MEMBER_VALUE':
            member.value = this.parseValue(propertyNode, rawValue);
            break;
        }
      }
    });

    if (uniqueName && levelName && hierarchyName) {
      this.setLevelExpression(member, uniqueName, levelName, hierarchyName);
    }

    return member;
  }

  private deserializeTuple(tupleNode: Element): IMdxTuple {
    const members: IMdxMember[] = [];
    tupleNode.childNodes.forEach((childNode: Element) => {
      if (childNode.nodeName === 'Member') {
        members.push(this.deserializeMember(childNode));
      }
    });

    return new MdxTuple(members);
  }

  private setLevelExpression(member: IMdxMember, uniqueName: string, levelName: string, hierarchyName: string) {
    if (hierarchyName === '[Measures]') {
      member.isMeasure = true;
      member.levelExpression = uniqueName;
    } else {
      member.isMeasure = false;
      member.levelExpression = uniqueName.startsWith(levelName) ? levelName : hierarchyName;
    }
  }

  private parseValue(node: Element, rawValue: string): NonNullable<MdxValue> {
    const typeAttribute = node.attributes.getNamedItem('xsi:type');
    if (typeAttribute) {
      switch (typeAttribute.value) {
        case 'xsd:double':
        case 'xsd:int':
        case 'xsd:long':
        case 'xsd:short':
        case 'xsd:unsignedInt':
          return Number(rawValue);
      }
    }

    return rawValue;
  }
}
