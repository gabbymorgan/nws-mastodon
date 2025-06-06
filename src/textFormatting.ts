import { StatusFormatterResponse } from "./types";

const { HEADER, FOOTER } = process.env;
const MAX_CHARACTERS = Number(process.env.MAX_CHARACTERS);

export const formatHeadStatus = (statusBody: string, link: string) => {
  const retObj: StatusFormatterResponse = {
    success: true,
    formattedText: "",
    remainder: "",
  };
  try {
    const addedCharacters = 8; // adjust accordingly if you add or remove characters from retObj.formattedText
    const truncationFactor =
      MAX_CHARACTERS -
      link.length -
      (HEADER?.length || 0) -
      (FOOTER?.length || 0) -
      addedCharacters;
    const statusLength = Math.min(truncationFactor, statusBody.length);
    const truncatedStatusBody = statusBody.substring(0, statusLength);
    retObj.remainder = statusBody.substring(statusLength);
    retObj.formattedText = `${HEADER}\n${truncatedStatusBody}...\n\n${link}\n\n${FOOTER}`;
  } catch (err) {
    retObj.success = false;
    retObj.error = formatErrorLogEntry(err, "formatHeadStatus");
  }
  return retObj;
};

export const formatNonheadStatus = (statusBody: string) => {
  const retObj: StatusFormatterResponse = {
    success: true,
    formattedText: "",
    remainder: "",
  };
  try {
    const ellipsis = 3;
    if (MAX_CHARACTERS < statusBody.length) {
      const truncationFactor = MAX_CHARACTERS - ellipsis;
      const truncatedStatusBody = statusBody.substring(0, truncationFactor);
      retObj.remainder = statusBody.substring(truncationFactor);
      retObj.formattedText = `${truncatedStatusBody}${
        retObj.remainder.length ? "..." : ""
      }`;
    } else {
      retObj.formattedText = statusBody;
    }
  } catch (err) {
    retObj.success = false;
    retObj.error = formatErrorLogEntry(err, "formatNonheadStatus");
  }
  return retObj;
};

export const formatErrorLogEntry = (error: any, method: string): string => {
  console.log(error) // last chance to see its original form
  if (error instanceof Error) {
    return `\n[${new Date().toLocaleString("en-US")}]- "${method}" ${
      error.message
    }`;
  }
  let stringified = "";
  try {
    stringified = JSON.stringify(error);
  } catch (error) {
    stringified = "[Unable to stringify]";
  }
  return stringified;
};
