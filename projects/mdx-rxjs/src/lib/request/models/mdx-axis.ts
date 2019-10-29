import { IMdxTuple } from './mdx-tuple';

export interface IMdxAxis {
  tuples: IMdxTuple[];

  firstTuple(): IMdxTuple;
  lastTuple(): IMdxTuple;
}

export class MdxAxis implements IMdxAxis {
  constructor(readonly tuples: IMdxTuple[]) {}

  firstTuple(): IMdxTuple {
    const tuple = this.tuples[0];
    if (!tuple) {
      throw Error(`Invalid axis. No tuples were defined.`);
    }

    return tuple;
  }

  lastTuple(): IMdxTuple {
    const tuple = this.tuples[this.tuples.length - 1];
    if (!tuple) {
      throw Error(`Invalid axis. No tuples were defined.`);
    }

    return tuple;
  }
}
