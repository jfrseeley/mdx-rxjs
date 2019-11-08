import { Observable } from 'rxjs';
import { IMdxHandler } from './mdx-handler';
import { IMdxResponse } from '../models/mdx-response';

export class ProxyMdxHandler implements IMdxHandler {
  constructor(private readonly handler: IMdxHandler, private readonly mdxInterceptor: (mdxStatement: string) => void) {}

  post(mdxStatement: string): Observable<IMdxResponse> {
    this.mdxInterceptor(mdxStatement);
    return this.handler.post(mdxStatement);
  }
}
