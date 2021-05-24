import { MdxValue, MdxComparisonOperator, MdxSortExpression } from './mdx-types';

export type MdxExpressionType = 'string' | 'hierarchy' | 'level' | 'logical' | 'member' | 'numeric' | 'set' | 'stringOrNumeric';
interface IMdxExpression {
  readonly expression: string;
  readonly type: MdxExpressionType;
}

export class MdxExpression implements IMdxExpression {
  constructor(readonly expression: string, readonly type: MdxExpressionType) {}

  toString(): string {
    return this.expression;
  }
}

export type MdxStringType = string | MdxStringExpression;
export interface MdxStringExpression extends IMdxExpression {
  readonly type: 'string';
}

export type MdxNumericType = string | number | MdxNumericExpression;
export interface MdxNumericExpression extends IMdxExpression {
  readonly type: 'numeric';
}

export type MdxLogicalType = string | MdxLogicalExpression;
export interface MdxLogicalExpression extends IMdxExpression {
  readonly type: 'logical';
}

export type MdxMemberType = string | number | MdxMemberExpression;
export interface MdxMemberExpression extends IMdxExpression {
  readonly type: 'member';
}

export type MdxLevelType = string | MdxLevelExpression;
export interface MdxLevelExpression extends IMdxExpression {
  readonly type: 'level';
}

export type MdxSetType = string | MdxSetExpression;
export interface MdxSetExpression extends IMdxExpression {
  readonly type: 'set';
}

export type MdxValueType = MdxStringType | MdxNumericType | MdxValueExpression;
export class MdxValueExpression extends MdxExpression {
  static fromType(expression: string, type: MdxExpressionType): MdxValueExpression {
    switch (type) {
      case 'string':
        return new MdxStringExpression(expression);
      case 'numeric':
        return new MdxNumericExpression(expression);
      case 'member':
        return new MdxMemberExpression(expression);
      case 'stringOrNumeric':
        return new MdxValueExpression(expression, 'stringOrNumeric');
      default:
        throw Error(`Invalid value expression. Type ${type} is not supported.`);
    }
  }

  static fromUnknown(expression: string): MdxValueExpression {
    return new MdxValueExpression(expression, 'stringOrNumeric');
  }

  static getExpressionType(value: MdxValueType): MdxExpressionType {
    switch (typeof value) {
      case 'string':
        return 'string';
      case 'number':
        return 'numeric';
      default:
        return value.type;
    }
  }

  static mergeExpressionTypes(...values: MdxValueType[]): MdxExpressionType {
    switch (values.length) {
      case 0:
        throw Error('Invalid set. At least one measure must be specified.');
      case 1:
        return this.getExpressionType(values[0]);
      default:
        const types = values.map((v) => this.getExpressionType(v));
        return new Set(types).size === 1 ? types[0] : 'stringOrNumeric';
    }
  }

  constructor(expression: string, type: MdxExpressionType) {
    super(expression, type);
  }

  evaluate(value: MdxValueType | null, operator: MdxComparisonOperator): MdxLogicalExpression {
    return new MdxLogicalExpression(`${this.expression} ${operator} ${value == null ? 'NULL' : value}`);
  }

  greaterThan(value: MdxValueType | null): MdxLogicalExpression {
    return this.evaluate(value, '>');
  }

  greaterThanOrEqualTo(value: MdxValueType | null): MdxLogicalExpression {
    return this.evaluate(value, '>=');
  }

  equalTo(value: MdxValueType | null): MdxLogicalExpression {
    return this.evaluate(value, '=');
  }

  lessThan(value: MdxValueType | null): MdxLogicalExpression {
    return this.evaluate(value, '<');
  }

  lessThanOrEqualTo(value: MdxValueType | null): MdxLogicalExpression {
    return this.evaluate(value, '<=');
  }

  notEqualTo(value: MdxValueType | null): MdxLogicalExpression {
    return this.evaluate(value, '<>');
  }
}

export class MdxStringExpression extends MdxValueExpression implements MdxStringExpression {
  static qualify(expression: MdxStringType): MdxStringExpression {
    return typeof expression === 'string' ? new MdxStringExpression(expression) : expression;
  }

  constructor(expression: string) {
    super(expression, 'string');
  }
}

export class MdxNumericExpression extends MdxValueExpression implements MdxNumericExpression {
  static qualify(expression: MdxNumericType): MdxNumericExpression {
    switch (typeof expression) {
      case 'string':
        return new MdxNumericExpression(expression);
      case 'number':
        return new MdxNumericExpression(expression.toString());
      default:
        return expression;
    }
  }

  constructor(expression: string) {
    super(expression, 'numeric');
  }
}

export class MdxLogicalExpression extends MdxExpression implements MdxLogicalExpression {
  static qualify(expression: MdxLogicalType): MdxLogicalExpression {
    return typeof expression === 'string' ? new MdxLogicalExpression(expression) : expression;
  }

  constructor(expression: string) {
    super(expression, 'logical');
  }

  iif(thenValue: MdxValueType, elseValue: MdxValueType): MdxValueExpression {
    const expression = `IIF(${this.expression},${thenValue},${elseValue})`;
    let type = MdxValueExpression.mergeExpressionTypes(thenValue, elseValue);
    if (type === 'member') {
      type = 'stringOrNumeric';
    }

    return MdxValueExpression.fromType(expression, type);
  }
}

export class MdxMemberExpression extends MdxValueExpression implements MdxMemberExpression {
  static qualify(expression: MdxMemberType): MdxMemberExpression {
    switch (typeof expression) {
      case 'string':
        return new MdxMemberExpression(expression);
      case 'number':
        return new MdxMemberExpression(expression.toString());
      default:
        return expression;
    }
  }

  constructor(expression: string) {
    super(expression, 'member');
  }

  asSet(): MdxSetExpression {
    return new MdxSetExpression(this.expression);
  }

  children(): MdxSetExpression {
    return new MdxSetExpression(`${this.expression}.children`);
  }
}

export class MdxLevelExpression extends MdxExpression implements MdxLevelExpression {
  static fromAttributes(attributes: string[]) {
    const unique = new Set<string>();
    return attributes.map((a) => {
      const level = new MdxLevelExpression(a);
      if (!level.isValid()) {
        throw new Error(`Invalid attribute ${a} detected. It must be a level expression.`);
      }

      if (level.isMeasure()) {
        throw new Error(`Invalid attribute ${a} detected. It must not be a measure.`);
      }

      if (!unique.add(a)) {
        throw new Error(`Invalid attribute ${a} detected. It may not be defined more than once.`);
      }

      return level;
    });
  }

  static fromMeasures(measures: string[]) {
    const unique = new Set<string>();
    return measures.map((m) => {
      const level = new MdxLevelExpression(m);
      if (!level.isValid()) {
        throw new Error(`Invalid measure ${m} detected. It must be a level expression.`);
      }

      if (!level.isMeasure()) {
        throw new Error(`Invalid measure ${m} detected. It must not be an attribute.`);
      }

      if (!unique.add(m)) {
        throw new Error(`Invalid measure ${m} detected. It may not be defined more than once.`);
      }

      return level;
    });
  }

  static qualify(expression: MdxLevelType): MdxLevelExpression {
    return typeof expression === 'string' ? new MdxLevelExpression(expression) : expression;
  }

  constructor(expression: string) {
    super(expression, 'level');
  }

  member(memberKey: MdxValue): MdxMemberExpression {
    return memberKey != null && memberKey !== ''
      ? new MdxMemberExpression(`${this.expression}.&[${memberKey}]`)
      : new MdxMemberExpression(`${this.expression}.&`);
  }

  children(): MdxSetExpression {
    return new MdxSetExpression(`${this.expression}.children`);
  }

  members(): MdxSetExpression {
    return new MdxSetExpression(`${this.expression}.members`);
  }

  select(memberKeys: MdxValue[]): MdxSetExpression {
    return MdxSetExpression.fromMembers(memberKeys.map((mk) => this.member(mk)));
  }

  set(includeAllAggregation?: boolean): MdxSetExpression {
    return includeAllAggregation ? this.members() : this.children();
  }

  value(): MdxValueExpression {
    return !this.isMeasure()
      ? MdxValueExpression.fromUnknown(`${this.expression}.MEMBER_VALUE`)
      : new MdxNumericExpression(this.expression);
  }

  isMeasure(): boolean {
    return this.expression.indexOf('[Measures]') === 0;
  }

  isValid(): boolean {
    return this.expression.startsWith('[') && this.expression.endsWith(']');
  }
}

export class MdxSetExpression extends MdxExpression implements MdxSetExpression {
  static fromMeasures(measures: MdxLevelExpression[]): MdxSetExpression {
    switch (measures.length) {
      case 0:
        throw Error('Invalid set. At least one measure must be specified.');
      case 1:
        return new MdxSetExpression(measures[0].expression);
      default:
        return new MdxSetExpression(`{${measures.join(',')}}`);
    }
  }

  static fromMembers(members: MdxMemberExpression[]): MdxSetExpression {
    switch (members.length) {
      case 0:
        throw Error('Invalid set. At least one member must be specified.');
      case 1:
        return members[0].asSet();
      default:
        return new MdxSetExpression(`{${members.join(',')}}`);
    }
  }

  static fromSets(sets: MdxSetExpression[]): MdxSetExpression {
    switch (sets.length) {
      case 0:
        throw Error('Invalid set. At least one expression must be specified.');
      case 1:
        return sets[0];
      default:
        return new MdxSetExpression(`CROSSJOIN(${sets.join(',')})`);
    }
  }

  static qualify(expression: MdxSetType): MdxSetExpression {
    return typeof expression === 'string' ? new MdxSetExpression(expression) : expression;
  }

  constructor(expression: string) {
    super(expression, 'set');
  }

  count(excludeEmpty?: boolean): MdxNumericExpression {
    return excludeEmpty
      ? new MdxNumericExpression(`COUNT(${this.expression},EXCLUDEEMPTY)`)
      : new MdxNumericExpression(`COUNT(${this.expression})`);
  }

  crossJoin(...sets: MdxSetType[]): MdxSetExpression {
    if (sets.length === 0) {
      throw new Error(`Invalid cross join on '${this.expression}.' At least one other set expression must be defined.`);
    }

    return new MdxSetExpression(`CROSSJOIN(${this.expression},${sets.join(',')})`);
  }

  union(...sets: MdxSetType[]): MdxSetExpression {
    if (sets.length === 0) {
      throw new Error(`Invalid union on '${this.expression}.' At least one other set expression must be defined.`);
    }

    return new MdxSetExpression(`UNION(${this.expression},${sets.join(',')})`);
  }

  extract(...hiearchies: MdxLevelType[]): MdxSetExpression {
    if (hiearchies.length === 0) {
      throw new Error(`Invalid extract on '${this.expression}.' At least one hieararchy expression must be defined.`);
    }

    return new MdxSetExpression(`EXTRACT(${this.expression},${hiearchies.join(',')})`);
  }

  filter(constraint: MdxLogicalType): MdxSetExpression {
    return new MdxSetExpression(`FILTER(${this.expression},${constraint})`);
  }

  nonEmpty(set?: MdxSetType): MdxSetExpression {
    return set ? new MdxSetExpression(`NONEMPTY(${this.expression},${set})`) : new MdxSetExpression(`NONEMPTY(${this.expression})`);
  }

  order(value: MdxValueType, sortExpression?: MdxSortExpression): MdxSetExpression {
    return sortExpression
      ? new MdxSetExpression(`ORDER(${this.expression},${value},${sortExpression})`)
      : new MdxSetExpression(`ORDER(${this.expression},${value})`);
  }

  subset(start: MdxNumericType, count?: MdxNumericType): MdxSetExpression {
    return count != null
      ? new MdxSetExpression(`SUBSET(${this.expression},${start},${count})`)
      : new MdxSetExpression(`SUBSET(${this.expression},${start})`);
  }

  head(count?: MdxNumericType): MdxSetExpression {
    return count != null ? new MdxSetExpression(`HEAD(${this.expression},${count})`) : new MdxSetExpression(`HEAD(${this.expression})`);
  }

  tail(count?: MdxNumericType): MdxSetExpression {
    return count != null ? new MdxSetExpression(`TAIL(${this.expression},${count})`) : new MdxSetExpression(`TAIL(${this.expression})`);
  }

  topCount(count: MdxNumericType, sortByDescending?: MdxNumericType): MdxSetExpression {
    return sortByDescending
      ? new MdxSetExpression(`TOPCOUNT(${this.expression},${count},${sortByDescending})`)
      : new MdxSetExpression(`TOPCOUNT(${this.expression},${count})`);
  }

  bottomCount(count: MdxNumericType, sortByDescending?: MdxNumericType): MdxSetExpression {
    return sortByDescending
      ? new MdxSetExpression(`BOTTOMCOUNT(${this.expression},${count},${sortByDescending})`)
      : new MdxSetExpression(`BOTTOMCOUNT(${this.expression},${count})`);
  }
}
