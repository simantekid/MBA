import { IrsStatus } from '../types/mba';

// Mapping langsung dari kolom "Status" tabel Response Code di dokumentasi APIMBA.
const RESPONSE_CODE_STATUS: Record<string, IrsStatus> = {
  '00': 'sukses',
  '01': 'pending',
  '02': 'gagal',
  '-1': 'gagal',
  '-2': 'gagal',
  '-3': 'gagal',
  '-4': 'gagal',
  '-5': 'gagal',
  '-6': 'gagal',
  '-7': 'gagal',
  '-8': 'gagal',
  '-9': 'gagal',
  '-10': 'gagal',
  '-11': 'pending',
  '-12': 'pending',
  '-14': 'pending',
  '-15': 'gagal',
  '99': 'pending',
  '127': 'gagal',
  '128': 'gagal',
  '999': 'pending',
};

export function mapMbaResponseCodeToIrsStatus(responseCode: string): IrsStatus {
  return RESPONSE_CODE_STATUS[responseCode] ?? 'gagal';
}
