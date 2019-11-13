import { MdxLevelExpression, MdxSetExpression } from '../mdx-expressions';
import { IMdxFilter } from '../mdx-types';
import { IMdxFilterOptions } from './models/mdx-filter-options';
import { IMdxSortOptions } from './models/mdx-sort-options';

export class MdxExpressionFactory {
  readonly queryAxisFilters: Map<string, IMdxFilter>;
  readonly slicerAxisFilters: Map<string, IMdxFilter>;
  readonly totalCountLevelExpressions: Set<string>;

  constructor(attributes: MdxLevelExpression[], readonly options: IMdxFilterOptions) {
    this.queryAxisFilters = new Map<string, IMdxFilter>();
    this.slicerAxisFilters = new Map<string, IMdxFilter>();
    this.totalCountLevelExpressions = new Set<string>();

    if (options.filters) {
      for (const filter of options.filters) {
        if (!this.slicerAxisFilters.set(filter.levelExpression, filter)) {
          throw new Error(`Invalid filter ${filter.levelExpression} detected. It may not be defined more than once.`);
        }
      }
    }

    for (const attribute of attributes) {
      const filter: IMdxFilter = this.slicerAxisFilters.get(attribute.expression) || { levelExpression: attribute.expression };
      this.slicerAxisFilters.delete(attribute.expression);

      if (filter.includeTotalCount) {
        this.totalCountLevelExpressions.add(attribute.expression);
      }

      if (!this.queryAxisFilters.set(attribute.expression, filter)) {
        throw new Error(`Invalid attribute ${attribute} detected. It may not be defined more than once.`);
      }
    }
  }

  createSetFromAttribute(attribute: MdxLevelExpression): MdxSetExpression {
    const filter = this.queryAxisFilters.get(attribute.expression) || this.slicerAxisFilters.get(attribute.expression);
    if (!filter) {
      throw new Error(`Invalid attribute ${attribute} detected. It must belong to one of the axes.`);
    }

    return attribute.set(filter.includeAll);
  }

  createSetFromAttributes(attributes: MdxLevelExpression[]): MdxSetExpression {
    const sets = attributes.map(a => this.createSetFromAttribute(a));
    return MdxSetExpression.fromSets(sets);
  }

  createSetFromSortOptions(
    attributes: MdxLevelExpression[],
    options: IMdxSortOptions,
    setup?: (lowestInclusiveSet: MdxSetExpression) => MdxSetExpression
  ): MdxSetExpression {
    let lowestInclusiveSet: MdxSetExpression;
    let pendingSets: MdxSetExpression[] = [];
    let attributesToExtract: MdxLevelExpression[] = [];

    const inclusiveLevelExpressions = this.getInclusiveLevelExpressions(options);
    if (inclusiveLevelExpressions.length === 0) {
      lowestInclusiveSet = this.createSetFromAttributes(attributes);
    } else {
      const unmatchedAttributes = new Map<string, MdxLevelExpression>();
      for (const inclusiveLevelExpression of inclusiveLevelExpressions) {
        const level = new MdxLevelExpression(inclusiveLevelExpression);
        if (!level.isMeasure()) {
          unmatchedAttributes.set(inclusiveLevelExpression, level);
        }
      }

      // If ordering only by measures, take the lowest grain, else the lowest inclusive grain
      const includedLevels: MdxLevelExpression[] = [];
      if (unmatchedAttributes.size === 0) {
        pendingSets = attributes.slice(0, attributes.length - 1).map(a => this.createSetFromAttribute(a));
        includedLevels.push(attributes[attributes.length - 1]);
      } else {
        for (let index = attributes.length - 1; index > -1; index--) {
          const nextLevel = attributes[index];
          if (unmatchedAttributes.size === 0) {
            pendingSets.splice(0, 0, this.createSetFromAttribute(nextLevel));
          } else {
            unmatchedAttributes.delete(nextLevel.expression);
            includedLevels.splice(0, 0, nextLevel);
          }
        }

        if (unmatchedAttributes.size > 0) {
          attributesToExtract = [...includedLevels];
          for (const attribute of unmatchedAttributes.values()) {
            includedLevels.push(attribute);
          }
        }
      }

      if (includedLevels.length === 0) {
        lowestInclusiveSet = MdxSetExpression.fromSets(pendingSets);
        pendingSets = [];
      } else {
        lowestInclusiveSet = this.createSetFromAttributes(includedLevels);
        pendingSets.push(lowestInclusiveSet);
      }
    }

    if (setup) {
      lowestInclusiveSet = setup(lowestInclusiveSet);
    }

    lowestInclusiveSet = this.extendSetWithSortOptions(lowestInclusiveSet, options);
    let allInclusiveSet = attributesToExtract.length > 0 ? lowestInclusiveSet.extract(...attributesToExtract) : lowestInclusiveSet;

    if (pendingSets.length > 0) {
      pendingSets[pendingSets.length - 1] = lowestInclusiveSet;
      allInclusiveSet = MdxSetExpression.fromSets(pendingSets);
    }

    return allInclusiveSet;
  }

  extendSetWithSortOptions(set: MdxSetExpression, options: IMdxSortOptions): MdxSetExpression {
    let cumulativeSet = set;
    if (options.orderBy) {
      for (let index = options.orderBy.length - 1; index > -1; index--) {
        const nextOrderBy = options.orderBy[index];
        if (nextOrderBy.levelExpression == null) {
          continue;
        }

        const level = new MdxLevelExpression(nextOrderBy.levelExpression);
        cumulativeSet = cumulativeSet.order(level.value(), nextOrderBy.sortDirection);
      }
    }

    if (options.skip != null && options.top != null) {
      cumulativeSet = cumulativeSet.subset(options.skip, options.top);
    } else if (options.skip != null) {
      cumulativeSet = cumulativeSet.subset(options.skip, set.count());
    } else if (options.top != null) {
      cumulativeSet = cumulativeSet.head(options.top);
    }

    return cumulativeSet;
  }

  getQueryAxis(): MdxSetExpression | null {
    return this.convertAxisFilters(this.queryAxisFilters);
  }

  getSlicerAxis(): MdxSetExpression | null {
    return this.convertAxisFilters(this.slicerAxisFilters);
  }

  getTotalCountSetExpression(): MdxSetExpression | null {
    return this.totalCountLevelExpressions.size > 0
      ? this.createSetFromAttributes(MdxLevelExpression.fromAttributes(Array.from(this.totalCountLevelExpressions)))
      : null;
  }

  private convertAxisFilters(filters: Map<string, IMdxFilter>): MdxSetExpression | null {
    const axisFilters: MdxSetExpression[] = [];
    for (const filter of filters.values()) {
      const memberKeys = filter.memberKeys ? filter.memberKeys : [];
      if (!filter.comparisonOperator && memberKeys.length === 0) {
        continue;
      }

      const level = new MdxLevelExpression(filter.levelExpression);
      let filterSet = memberKeys.length > 0 ? level.select(memberKeys) : level.set(filter.includeAll);

      if (filter.comparisonOperator) {
        const value = filter.comparisonValue != null ? filter.comparisonValue : null;
        filterSet = filterSet.filter(level.value().evaluate(value, filter.comparisonOperator));
      }

      axisFilters.push(filterSet);
    }

    return axisFilters.length > 0 ? MdxSetExpression.fromSets(axisFilters) : null;
  }

  private getInclusiveLevelExpressions(options: IMdxSortOptions): string[] {
    return options.orderBy && options.orderBy.length > 0
      ? Array.from(
          new Set<string>([...options.orderBy.map(o => o.levelExpression), ...this.totalCountLevelExpressions])
        )
      : Array.from(this.totalCountLevelExpressions);
  }
}
