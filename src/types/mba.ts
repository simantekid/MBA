// IRS-facing types (Mitra/Agen -> IRS -> Middleware). Sama shape kayak lapakgaming-module-express
// biar IRS tinggal ganti base URL tanpa ubah kontrak.

export type IrsStatus = 'pending' | 'sukses' | 'gagal';

export interface IrsOrderRequest {
  idtrx: string;
  tujuan: string;
  kode: string;
}

export interface IrsOrderResponse {
  idtrx: string;
  tujuan: string;
  kode: string;
  vendor_idtrx: string | null;
  status: IrsStatus;
  sn: string | null;
  msg: string;
  // Diteruskan apa adanya dari MBA (ProductPrice / Balance). null = MBA balikin kosong.
  price: string | null;
  balance: string | null;
}

export interface OrderRecord {
  idtrx: string;
  vendor_idtrx: string | null;
  kode: string;
  tujuan: string;
  status: IrsStatus;
  sn: string | null;
  msg: string;
  price: string | null;
  balance: string | null;
  created_at: string;
  updated_at: string;
}

// MBA SOAP method results (field XML di-parse jadi object, semua tetap string sesuai WSDL)

export interface TopupRequestResult {
  ResponseCode: string;
  CRefId: string;
  TransID: string;
  ProductCode: string;
  MSIDN: string;
  SerialNo: string;
  ProductPrice: string;
  Balance: string;
  FullResponse: string;
}

export interface CheckTransactionStatusDetailResult {
  ResponseCode: string;
  CRefId: string;
  TransID: string;
  ProductCode: string;
  MSIDN: string;
  ProductPrice: string;
  Balance: string;
  FullResponse: string;
  SerialNo: string;
}

export interface CheckBalanceResult {
  ResponseCode: string;
  Balance: string;
  BalanceCall: string;
  BalanceUsage: string;
  FullResponse: string;
}

export interface ChangePassResult {
  ResponseCode: string;
  FullResponse: string;
}

export interface ReqDepMerResult {
  ResponseCode: string;
  FullResponse: string;
}

export interface GetorCheckFileDwnldResult {
  ResponseCode: string;
  CRefId: string;
  FEncrypt: string;
  SerialNo: string;
  FullResponse: string;
}

// Payload POST callback status transaksi dari MBA (URL Callback), format key=value&key=value
export interface OrderCallbackPayload {
  TransID: string;
  CRefId: string;
  MSIDN: string;
  ProductCode: string;
  ProductPrice: string;
  ResponseCode: string;
  Balance: string;
  FullResponse: string;
  SerialNo: string;
}
