import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IMdxHandler } from './mdx-handler';
import { IMdxResponse } from '../models/mdx-response';

export class ProxyMdxHandler implements IMdxHandler {
  constructor(
    private readonly handler: IMdxHandler,
    private readonly requestInterceptor: (mdxStatement: string) => string,
    private readonly responseInterceptor: (mdxResponse: IMdxResponse) => IMdxResponse
  ) {}

  post(mdxStatement: string): Observable<IMdxResponse> {
    return this.handler.post(this.requestInterceptor(mdxStatement)).pipe(map((response) => this.responseInterceptor(response)));
  }
}
