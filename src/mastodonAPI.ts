import axios from "axios";
import { ExternalAPIResponse } from "./types";
import { formatErrorLogEntry } from "./textFormatting";

const authToken = process.env.AUTH_TOKEN

export const postHeadStatus = async (
  statusMessage: string
): Promise<ExternalAPIResponse> => {
  const returnObj: ExternalAPIResponse = { success: true };
  try {
    const response = await axios.post(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses`,
      {
        status: statusMessage,
      }, { headers: { Authorization: `Bearer ${authToken}` } }
    );
    returnObj.response = response;
  } catch (error) {
    returnObj.success = false;
    returnObj.error = error;
  }
  return returnObj;
};

export const postNonheadStatus = async (statusMessage: string, inReplyToId: string) => {
  const returnObj: ExternalAPIResponse = { success: true };
  try {
    const response = await axios.post(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses`,
      {
        status: statusMessage,
        in_reply_to_id: inReplyToId,
      }, { headers: { Authorization: `Bearer ${authToken}` } }
    );
    returnObj.response = response;
  } catch (err) {
    returnObj.success = false;
    returnObj.error = formatErrorLogEntry(err, "postNonheadStatus");
  }
  return returnObj;
};

export const deleteStatus = async (statusId: string): Promise<ExternalAPIResponse> => {
  const returnObj: ExternalAPIResponse = { success: true };
  try {
    const response = await axios.delete(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses/${statusId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }

    );
    returnObj.response = response;
  } catch (err) {
    returnObj.success = false;
    returnObj.error = formatErrorLogEntry(err, "deleteStatus");
  }
  return returnObj;
};

export const getAllStatuses = async (accountId: string): Promise<ExternalAPIResponse> => {
  const returnObj: ExternalAPIResponse = { success: true };
  try {
    const response = await axios.get(
      `https://${process.env.DOMAIN_NAME}/api/v1/accounts/${accountId}/statuses`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    returnObj.response = response;
  } catch (err) {
    returnObj.success = false;
    returnObj.error = formatErrorLogEntry(err, "getAllStatuses");
  }
  return returnObj;
};
