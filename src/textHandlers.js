export const formatHeadStatus = (statusBody, link) => {
  const retObj = {
    success: true,
    error: null,
    statusMessage: "",
    remainder: "",
  };
  try {
    const { HEADER, FOOTER, MAX_CHARACTERS } = process.env;
    const addedCharacters = 8; // adjust accordingly if you add or remove characters from retObj.statusMessage
    const truncationFactor =
      MAX_CHARACTERS -
      link.length -
      HEADER.length -
      FOOTER.length -
      addedCharacters;
    const statusLength = Math.min(truncationFactor, statusBody.length);
    const truncatedStatusBody = statusBody.substring(0, statusLength);
    retObj.remainder = statusBody.substring(statusLength);
    retObj.statusMessage = `${HEADER}\n${truncatedStatusBody}...\n\n${link}\n\n${FOOTER}`;
  } catch (err) {
    retObj.success = false;
    retObj.error = err.toString();
  }
  return retObj;
};

export const formatNonheadStatus = (statusBody) => {
  const retObj = {
    success: true,
    error: null,
    statusMessage: "",
    remainder: "",
  };
  try {
    const { MAX_CHARACTERS } = process.env;
    const ellipsis = 3;
    if (MAX_CHARACTERS < statusBody.length) {
      const truncationFactor = MAX_CHARACTERS - ellipsis;
      const truncatedStatusBody = statusBody.substring(0, truncationFactor);
      retObj.remainder = statusBody.substring(truncationFactor);
      retObj.statusMessage = `${truncatedStatusBody}${
        retObj.remainder.length ? "..." : ""
      }`;
    } else {
      retObj.statusMessage = statusBody;
    }
  } catch (err) {
    retObj.success = false;
    retObj.error = err;
  }
  return retObj;
};

export const formatLog = ({ error, method }) => {
  let errorMessage = error.toString();
  if (error.response && error.response.data) {
    errorMessage += ": " + error.response.data.error;
  }
  return `\n[${new Date().toLocaleString(
    "en-US"
  )}]- "${method}" ${errorMessage} `;
};
