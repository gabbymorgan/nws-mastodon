export const parseDescription = (description) => {
  return (
    description.replaceAll(/www/g, "https://www") +
    "\n\n#Denton #DentonWeather #DentonTX #DentonAlerts"
  );
};
