export const parsePost = (bodyComponents, link) => {
  let postMessage = process.env.HEADER + "\n";
  bodyComponents.forEach((bodyComponent) => {
    postMessage += bodyComponent + "\n\n";
  });
  const footer = process.env.FOOTER;
  postMessage = postMessage.substring(
    0,
    process.env.MAX_CHARACTERS - 7 - link.length - footer.length
  );
  postMessage += "...\n\n" + link;
  postMessage += "\n\n" + footer;
  return postMessage;
};

export const formatLog = ({ error, method }) => {
  let errorMessage = error.toString();
  if (error.response && error.response.data) {
    errorMessage += ": " + error.response.data.error;
  }
  return `\n[${new Date().toLocaleString(
    "en-US"
  )}] - "${method}" ${errorMessage}`;
};
