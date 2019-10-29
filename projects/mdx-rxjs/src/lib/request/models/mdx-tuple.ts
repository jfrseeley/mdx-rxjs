import { IMdxMember } from './mdx-member';

export interface IMdxTuple {
  members: IMdxMember[];

  firstMember(): IMdxMember;
  lastMember(): IMdxMember;
}

export class MdxTuple implements IMdxTuple {
  constructor(readonly members: IMdxMember[]) {}

  firstMember(): IMdxMember {
    const member = this.members[0];
    if (!member) {
      throw Error(`Invalid tuple. No members were defined.`);
    }

    return member;
  }

  lastMember(): IMdxMember {
    const member = this.members[this.members.length - 1];
    if (!member) {
      throw Error(`Invalid tuple. No members were defined.`);
    }

    return member;
  }
}
