import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3010),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mba: {
    soapUrl: required('MBA_SOAP_URL', 'http://103.52.146.230:9092/Service.asmx'),
    username: required('MBA_USERNAME'),
    signKey: required('MBA_SIGNKEY'),
  },
  // URL IRS buat nerima push saat callback status transaksi dari MBA masuk.
  // Kosongin kalau forwarding belum mau diaktifin.
  irsCallbackUrl: process.env.IRS_CALLBACK_URL ?? '',
};
