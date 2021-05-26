import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IMdxHandler } from './mdx-handler';
import { IMdxResponse } from '../models/mdx-response';
import { ObservableInput } from 'rxjs';

export class ProxyMdxHandler<O extends ObservableInput<any>> implements IMdxHandler {
  constructor(
    private readonly handler: IMdxHandler,
    private readonly interceptors: {
      catchError?: (err: any, caught: Observable<IMdxResponse>) => O;
      request?: (mdxStatement: string) => string;
      response?: (mdxResponse: IMdxResponse) => IMdxResponse;
    }
  ) {}

  post(mdxStatement: string): Observable<IMdxResponse> {
    let mdxResponse$ = this.handler.post(this.interceptors.request ? this.interceptors.request(mdxStatement) : mdxStatement);
    if (this.interceptors.catchError) {
      const interceptor = this.interceptors.catchError;
      mdxResponse$ = mdxResponse$.pipe(catchError((err, caught) => interceptor(err, caught)));
    }

    if (this.interceptors.response) {
      const interceptor = this.interceptors.response;
      mdxResponse$ = mdxResponse$.pipe(map((response) => interceptor(response)));
    }

    return mdxResponse$;
  }
}
