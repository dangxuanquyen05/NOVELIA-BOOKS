export type ShippingStatus = 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED_ATTEMPT' | 'RETURNED';

export interface Shipment {
  id: number;
  orderId: number;
  orderNumber?: string;
  receiverName?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  shippingCarrier: string;
  shippingStatus: ShippingStatus;
  liveCarrierConnected: boolean;
  integrationNotice: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentInput {
  orderId: number;
  carrierName?: string;
  note?: string;
}

export interface UpdateShipmentStatusInput {
  shippingStatus: ShippingStatus;
  note?: string;
  actualDelivery?: string;
}

export interface ShippingFeeCalculateInput {
  toProvince?: string;
  toDistrict?: string;
  toWard?: string;
  toDistrictId?: number;
  toWardCode?: string;
  weightGrams?: number;
  orderAmount: number;
}

export interface ShippingFeeCalculateResult {
  carrierName: string;
  shippingFee: number;
  originalFee: number;
  discountShippingFee: number;
  isFreeShipping: boolean;
  estimatedDays: number;
  calculationMethod: 'GHN_LIVE_API' | 'NOVELIA_STANDARD_POLICY';
  liveCarrierConnected: boolean;
  notice: string;
}
