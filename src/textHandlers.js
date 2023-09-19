export const parseDescription = (description) => {
  return (
    description.replaceAll(/www/g, "https://www") +
    "\n\n" + process.env.TAGLINE
  );
};

export const formatLog = ({ error, method }) => {
  const errorMessage = error.toString();
  return `\n[${new Date().toLocaleString("en-US")}] - "${method}" ${error}`;
};
