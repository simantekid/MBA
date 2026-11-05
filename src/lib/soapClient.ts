import axios from 'axios';
import { config } from '../config/env';

const soapClient = axios.create({
  baseURL: config.mba.soapUrl,
  timeout: 20000,
  responseType: 'text',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
  },
});

export async function callSoap(action: string, xmlBody: string): Promise<string> {
  const { data } = await soapClient.post<string>('', xmlBody, {
    headers: { SOAPAction: `https://mba.id/${action}` },
  });
  return data;
}
