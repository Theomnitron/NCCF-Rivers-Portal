export interface BankAccountConfig {
  accountNumber: string;
  bankName: string;
  accountName: string;
}

export interface DeveloperSupportConfig {
  phoneFormatted: string;
  phoneRaw: string;
}

export const APP_CONFIG = {
  // General Dues Account (Members, Room Governors, GEE)
  generalDuesAccount: {
    accountNumber: import.meta.env.VITE_DUES_ACCOUNT_NUMBER,
    bankName: import.meta.env.VITE_DUES_BANK_NAME,
    accountName: import.meta.env.VITE_DUES_ACCOUNT_NAME,
  } as BankAccountConfig,

  // Executive Dues Account (Executive Status)
  executiveDuesAccount: {
    accountNumber: import.meta.env.VITE_EXECUTIVE_DUES_ACCOUNT_NUMBER,
    bankName: import.meta.env.VITE_EXECUTIVE_DUES_BANK_NAME,
    accountName: import.meta.env.VITE_EXECUTIVE_DUES_ACCOUNT_NAME,
  } as BankAccountConfig,

  // Developer & Welfare Team Contact
  developerSupport: {
    phoneFormatted: import.meta.env.VITE_DEV_SUPPORT_PHONE,
    phoneRaw: import.meta.env.VITE_DEV_SUPPORT_RAW_PHONE,
  } as DeveloperSupportConfig,
};

/**
 * Returns the appropriate dues deposit account details based on user's house status.
 * If user houseStatus is 'Executive', returns Executive account.
 * Otherwise, returns General account.
 */
export function getDuesAccountDetails(houseStatus?: string | null): BankAccountConfig {
  if (houseStatus && houseStatus.trim().toLowerCase() === 'executive') {
    return APP_CONFIG.executiveDuesAccount;
  }
  return APP_CONFIG.generalDuesAccount;
}
