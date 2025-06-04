import axios from "axios";

export const postHeadStatus = async (statusMessage) => {
  const returnObj = { response: {}, success: true, error: null };
  try {
    const response = await axios.post(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses`,
      {
        status: statusMessage,
      }
    );
    if (response.error) {
      returnObj.success = false;
      returnObj.error = response.error;
    }
    returnObj.response = response.data;
  } catch (err) {
    returnObj.success = false;
    returnObj.error = err;
  }
  return returnObj;
};

export const postNonheadStatus = async (statusMessage, inReplyToId) => {
  const returnObj = { response: {}, success: true, error: null };
  try {
    const response = await axios.post(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses`,
      {
        status: statusMessage,
        in_reply_to_id: inReplyToId,
      }
    );
    if (response.error) {
      returnObj.success = false;
      returnObj.error = response.error;
    }
    returnObj.response = response.data;
  } catch (err) {
    returnObj.success = false;
    returnObj.error = err;
  }
  return returnObj;
};

export const deleteStatus = async (statusId) => {
  const returnObj = { response: {}, success: true, error: null };
  try {
    const response = await axios.delete(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses/${statusId}`
    );
    if (response.error) {
      returnObj.success = false;
      returnObj.error = response.error;
    }
    returnObj.response = response.data;
  } catch (err) {
    returnObj.success = false;
    returnObj.error = err;
  }
  return returnObj;
};
