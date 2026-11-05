import { callSoap } from '../lib/soapClient';
import { soapEnvelope, escapeXml, parseSoapResult } from '../lib/xml';
import { config } from '../config/env';
import {
  TopupRequestResult,
  CheckTransactionStatusDetailResult,
  CheckBalanceResult,
  ChangePassResult,
  ReqDepMerResult,
  GetorCheckFileDwnldResult,
} from '../types/mba';

export async function topupRequest(params: {
  msisdn: string;
  productCode: string;
  crefId: string;
  storeId?: string;
}): Promise<TopupRequestResult> {
  const body = `<TopupRequest xmlns="https://mba.id/">
      <Msisdn>${escapeXml(params.msisdn)}</Msisdn>
      <ProductCode>${escapeXml(params.productCode)}</ProductCode>
      <UserName>${escapeXml(config.mba.username)}</UserName>
      <SignKey>${escapeXml(config.mba.signKey)}</SignKey>
      <CRefId>${escapeXml(params.crefId)}</CRefId>
      <StoreId>${escapeXml(params.storeId ?? '')}</StoreId>
    </TopupRequest>`;
  const xml = await callSoap('TopupRequest', soapEnvelope(body));
  return parseSoapResult<TopupRequestResult>(xml);
}

export async function checkTransactionStatusDetail(params: {
  crefId: string;
}): Promise<CheckTransactionStatusDetailResult> {
  const body = `<CheckTransactionStatusDetail xmlns="https://mba.id/">
      <UserName>${escapeXml(config.mba.username)}</UserName>
      <SignKey>${escapeXml(config.mba.signKey)}</SignKey>
      <CRefId>${escapeXml(params.crefId)}</CRefId>
    </CheckTransactionStatusDetail>`;
  const xml = await callSoap('CheckTransactionStatusDetail', soapEnvelope(body));
  return parseSoapResult<CheckTransactionStatusDetailResult>(xml);
}

export async function checkBalance(): Promise<CheckBalanceResult> {
  const body = `<CheckBalance xmlns="https://mba.id/">
      <UserName>${escapeXml(config.mba.username)}</UserName>
      <SignKey>${escapeXml(config.mba.signKey)}</SignKey>
    </CheckBalance>`;
  const xml = await callSoap('CheckBalance', soapEnvelope(body));
  return parseSoapResult<CheckBalanceResult>(xml);
}

// GetProductResult tipe-nya "xmlxml" di WSDL: isinya string yang berisi XML daftar produk.
export async function getProduct(): Promise<string> {
  const body = `<GetProduct xmlns="https://mba.id/">
      <UserName>${escapeXml(config.mba.username)}</UserName>
      <SignKey>${escapeXml(config.mba.signKey)}</SignKey>
    </GetProduct>`;
  const xml = await callSoap('GetProduct', soapEnvelope(body));
  return parseSoapResult<string>(xml);
}

export async function changePassTrx(params: { newSignKey: string }): Promise<ChangePassResult> {
  const body = `<ChangePassTrx xmlns="https://mba.id/">
      <UserName>${escapeXml(config.mba.username)}</UserName>
      <SignKey>${escapeXml(config.mba.signKey)}</SignKey>
      <NSignKey>${escapeXml(params.newSignKey)}</NSignKey>
    </ChangePassTrx>`;
  const xml = await callSoap('ChangePassTrx', soapEnvelope(body));
  return parseSoapResult<ChangePassResult>(xml);
}

export async function changePassWeb(params: {
  unWeb: string;
  passWeb: string;
  newPassWeb: string;
}): Promise<ChangePassResult> {
  const body = `<ChangePassWeb xmlns="https://mba.id/">
      <UserName>${escapeXml(config.mba.username)}</UserName>
      <SignKey>${escapeXml(config.mba.signKey)}</SignKey>
      <UnWeb>${escapeXml(params.unWeb)}</UnWeb>
      <PassWeb>${escapeXml(params.passWeb)}</PassWeb>
      <NPassWeb>${escapeXml(params.newPassWeb)}</NPassWeb>
    </ChangePassWeb>`;
  const xml = await callSoap('ChangePassWeb', soapEnvelope(body));
  return parseSoapResult<ChangePassResult>(xml);
}

export async function reqDepMer(params: {
  idBank: string;
  refBank: string;
  amount: string;
  merchantType: string;
  remarks: string;
  pType: string;
}): Promise<ReqDepMerResult> {
  const body = `<ReqDepMer xmlns="https://mba.id/">
      <UserName>${escapeXml(config.mba.username)}</UserName>
      <SignKey>${escapeXml(config.mba.signKey)}</SignKey>
      <IdBank>${escapeXml(params.idBank)}</IdBank>
      <RefBank>${escapeXml(params.refBank)}</RefBank>
      <Amount>${escapeXml(params.amount)}</Amount>
      <MerchantType>${escapeXml(params.merchantType)}</MerchantType>
      <Remarks>${escapeXml(params.remarks)}</Remarks>
      <PType>${escapeXml(params.pType)}</PType>
    </ReqDepMer>`;
  const xml = await callSoap('ReqDepMer', soapEnvelope(body));
  return parseSoapResult<ReqDepMerResult>(xml);
}

export async function getOrCheckFileDwnld(params: {
  crefId: string;
  transId: string;
}): Promise<GetorCheckFileDwnldResult> {
  const body = `<GetorCheckFileDwnld xmlns="https://mba.id/">
      <UserName>${escapeXml(config.mba.username)}</UserName>
      <SignKey>${escapeXml(config.mba.signKey)}</SignKey>
      <CRefId>${escapeXml(params.crefId)}</CRefId>
      <TransID>${escapeXml(params.transId)}</TransID>
    </GetorCheckFileDwnld>`;
  const xml = await callSoap('GetorCheckFileDwnld', soapEnvelope(body));
  return parseSoapResult<GetorCheckFileDwnldResult>(xml);
}
