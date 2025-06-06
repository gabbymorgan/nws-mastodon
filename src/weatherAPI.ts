import axios from "axios";
import { ExternalAPIResponse } from "./types";
import { formatErrorLogEntry } from "./textFormatting";

export const postHeadStatus = async (
  statusMessage: string
): Promise<ExternalAPIResponse> => {
  const returnObj: ExternalAPIResponse = { success: true };
  try {
    const response = await axios.post(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses`,
      {
        status: statusMessage,
      }
    );
    returnObj.response = response;
  } catch (error) {
    returnObj.success = false;

  }
  return returnObj;
};

export const postNonheadStatus = async (statusMessage:string, inReplyToId:string) => {
  const returnObj:ExternalAPIResponse = { success: true };
  try {
    const response = await axios.post(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses`,
      {
        status: statusMessage,
        in_reply_to_id: inReplyToId,
      }
    );
    returnObj.response = response;
  } catch (err) {
    returnObj.success = false;
    returnObj.error = formatErrorLogEntry(err, "postNonheadStatus");
  }
  return returnObj;
};

export const deleteStatus = async (statusId:string):Promise<ExternalAPIResponse> => {
  const returnObj:ExternalAPIResponse = { success: true };
  try {
    const response = await axios.delete(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses/${statusId}`
    );
    returnObj.response = response;
  } catch (err) {
    returnObj.success = false;
    returnObj.error = formatErrorLogEntry(err, "deleteStatus");
  }
  return returnObj;
};
