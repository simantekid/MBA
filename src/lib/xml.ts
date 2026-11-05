import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ removeNSPrefix: true, ignoreAttributes: true, parseTagValue: false });

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function soapEnvelope(bodyXml: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${bodyXml}
  </soap:Body>
</soap:Envelope>`;
}

// Setiap MBA SOAP response bentuknya Envelope.Body.<Method>Response.<Method>Result.*
// (GetProduct beda: Result-nya langsung string XML, bukan object). Ambil isi Result
// tanpa perlu tau nama tag persis, cukup ambil key pertama dua level di bawah Body.
export function parseSoapResult<T>(xml: string): T {
  const parsed = parser.parse(xml);
  const body = parsed?.Envelope?.Body ?? {};
  const responseKey = Object.keys(body)[0];
  const response = responseKey ? body[responseKey] : undefined;

  if (response && typeof response === 'object') {
    const resultKey = Object.keys(response)[0];
    if (resultKey) return response[resultKey] as T;
  }

  return response as T;
}
