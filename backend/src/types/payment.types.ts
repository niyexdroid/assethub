export interface FeeBreakdown {
  rent:         number;
  platform_fee: number;
  total_charged: number;
  fee_percent:  number;
}

export interface PaystackInitResponse {
  authorization_url: string;
  access_code:       string;
  reference:         string;
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference:        string;
    status:           string;
    amount:           number;
    currency:         string;
    paid_at:          string;
    channel:          string;
    gateway_response: string;
    subaccount?: { subaccount_code: string };
  };
}
