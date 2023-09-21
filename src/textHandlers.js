export const parseDescription = (description) => {
  return (
    process.env.HEADER + "\n" +
    description.replaceAll(/www/g, "https://www") + "\n\n" +
    process.env.FOOTER
  );
};

export const formatLog = ({ error, method }) => {
  const errorMessage = error.toString();
  return `\n[${new Date().toLocaleString("en-US")}] - "${method}" ${error}`;
};
