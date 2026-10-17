export interface PaymentUrlResponse {
  paymentUrl: string;
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  sandboxMode: boolean;
  liveCredentialsConfigured: boolean;
  integrationNotice: string;
}

export interface PaymentCallbackResult {
  success: boolean;
  orderNumber: string;
  transactionCode?: string;
  amount: number;
  paymentStatus: string;
  responseCode?: string;
  message: string;
  isDuplicateRetry: boolean;
}
