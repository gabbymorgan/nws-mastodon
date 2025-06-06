import { AxiosResponse } from "axios";

export interface Response {
  success: boolean;
  error?: string;
}

export interface StorageResponse extends Response {}

export interface ExternalAPIResponse extends Response {
  response?: AxiosResponse;
}

export interface FormatterResponse extends Response {
  formattedText: string;
}

export interface StatusFormatterResponse extends FormatterResponse {
  remainder: string;
}

export type PostedAlert = {
  alertId: string;
  statusIds: [string];
};

export type NWSAlert = {
  id: string;
  properties: {
    parameters: {
      NWSheadline?: string[]
    };
    description: string,
    headline: string
  };
};
