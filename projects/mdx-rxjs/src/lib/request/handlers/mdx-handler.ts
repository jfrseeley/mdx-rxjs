import { Observable } from 'rxjs';
import { IMdxResponse } from '../models/mdx-response';

export interface IMdxHandler {
  post(mdxStatement: string): Observable<IMdxResponse>;
}
