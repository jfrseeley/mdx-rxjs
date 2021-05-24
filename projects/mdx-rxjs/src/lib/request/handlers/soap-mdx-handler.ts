import { Observable } from 'rxjs';
import { XmlMdxHandler } from './xml-mdx-handler';
import { IMdxResponse } from '../models/mdx-response';

export class SoapMdxHandler extends XmlMdxHandler {
  private readonly baseXPath: string = '/soap:Envelope/soap:Body/xmla:ExecuteResponse/xmla:return';
  private readonly dataRootXPath: string = `${this.baseXPath}/data:root`;
  private readonly errorXPath: string = `${this.baseXPath}/empty:root/exception:Messages/exception:Error/@Description`;
  private readonly faultXPath: string = '/soap:Envelope/soap:Body/soap:Fault/soap:faultstring';
  private readonly namespaceResolver: XPathNSResolver = {
    lookupNamespaceURI: (prefix: string): string => {
      switch (prefix) {
        case 'soap':
          return 'http://schemas.xmlsoap.org/soap/envelope/';
        case 'xmla':
          return 'urn:schemas-microsoft-com:xml-analysis';
        case 'data':
          return 'urn:schemas-microsoft-com:xml-analysis:mddataset';
        case 'exception':
          return 'urn:schemas-microsoft-com:xml-analysis:exception';
        case 'empty':
          return 'urn:schemas-microsoft-com:xml-analysis:empty';
        default:
          return '';
      }
    },
  };

  constructor(private readonly catalog: string, private readonly url: string) {
    super();
  }

  post(mdxStatement: string): Observable<IMdxResponse> {
    return new Observable((subscriber) => {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.open('POST', this.url, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            if (xhr.responseXML) {
              const rootXPathResult = xhr.responseXML.evaluate(
                this.dataRootXPath,
                xhr.responseXML,
                this.namespaceResolver,
                XPathResult.ANY_TYPE,
                null
              );

              const rootNode = rootXPathResult.iterateNext();
              if (rootNode) {
                const response = this.deserializeResponse(rootNode as Element);
                subscriber.next(response);
              } else {
                const error = this.deserializeErrors(xhr.responseXML) || this.deserializeFault(xhr.responseXML) || xhr.response;
                subscriber.error(error || 'Encountered an unexpected MDX error. No response was provided.');
              }
            }

            subscriber.complete();
          } else {
            subscriber.error(xhr.response || 'Encountered an unexpected MDX error. No response was provided.');
          }
        }
      };

      xhr.setRequestHeader('Content-Type', 'text/xml');

      const soapEnvelope = this.createSoapEnvelope(mdxStatement);
      xhr.send(soapEnvelope);

      return () => {
        xhr.abort();
      };
    });
  }

  private createSoapEnvelope(mdxStatement: string): string {
    return `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
  <Body>
    <Execute xmlns="urn:schemas-microsoft-com:xml-analysis">
      <Command>
        <Statement>
          <![CDATA[
            ${mdxStatement}
          ]]>
        </Statement>
      </Command>
      <Properties>
        <PropertyList>
          <Catalog>${this.catalog}</Catalog>
          <ShowHiddenCubes>True</ShowHiddenCubes>
          <SspropInitAppName>Microsoft SQL Server Management Studio</SspropInitAppName>
          <Timeout>3600</Timeout>
          <LocaleIdentifier>9</LocaleIdentifier>
        </PropertyList>
      </Properties>
    </Execute>
  </Body>
</Envelope>`;
  }

  private deserializeErrors(xml: Document): string | string[] | null {
    const errors: string[] = [];
    const errorXPathResult = xml.evaluate(this.errorXPath, xml, this.namespaceResolver, XPathResult.ANY_TYPE, null);
    let errorNode = errorXPathResult.iterateNext();

    while (errorNode) {
      if (errorNode.textContent) {
        errors.push(errorNode.textContent);
      }

      errorNode = errorXPathResult.iterateNext();
    }

    if (errors.length > 1) {
      return errors;
    }

    if (errors.length === 1) {
      return errors[0];
    }

    return null;
  }

  private deserializeFault(xml: Document): string | null {
    const faultXPathResult = xml.evaluate(this.faultXPath, xml, this.namespaceResolver, XPathResult.ANY_TYPE, null);
    const faultNode = faultXPathResult.iterateNext();
    return faultNode ? faultNode.textContent : null;
  }
}
