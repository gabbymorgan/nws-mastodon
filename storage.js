import fs from "fs";

export const appendPostedAlertToJson = (postedAlert) => {
  const postedAlerts = JSON.parse(
    fs.readFileSync("./posted-alerts.json", "utf-8")
  );
  postedAlerts.push(postedAlert);
  fs.writeFileSync("./posted-alerts.json", JSON.stringify(postedAlerts));
};

export const removeAlertFromJson = (alertId) => {
  const updatedAlerts = [...postedAlerts].filter(
    (postedAlert) => postedAlert.alertId !== alertId
  );
  fs.writeFileSync("./posted-alerts.json", JSON.stringify(updatedAlerts));
};

export const getPostedAlerts = () =>
  JSON.parse(fs.readFileSync("./posted-alerts.json", "utf-8"));
