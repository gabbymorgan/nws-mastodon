import fs from "fs";
import { formatLog } from "./textHandlers";

export const initializeStorage = () => {
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data")
  }
  if (!fs.existsSync("./data/posted-alerts.json")) {
    fs.writeFileSync("./data/posted-alerts.json", "[]")
  }
  if (!fs.existsSync("./data/errors.log")) {
    fs.writeFileSync("./data/errors.log", "")
  }
}

export const appendPostedAlertToJson = (postedAlert) => {
  const postedAlerts = JSON.parse(
    fs.readFileSync("./data/posted-alerts.json", "utf-8")
  );
  postedAlerts.push(postedAlert);
  fs.writeFileSync("./data/posted-alerts.json", JSON.stringify(postedAlerts));
};

export const removeAlertFromJson = (alertId) => {
  const postedAlerts = getPostedAlerts();
  const updatedAlerts = [...postedAlerts].filter(
    (postedAlert) => postedAlert.alertId !== alertId
  );
  fs.writeFileSync("./data/posted-alerts.json", JSON.stringify(updatedAlerts));
};

export const getPostedAlerts = () =>
  JSON.parse(fs.readFileSync("./data/posted-alerts.json", "utf-8"));

export const logErrorToFile = (errorLogObject) => {
  fs.appendFileSync("./data/errors.log", formatLog(errorLogObject));
};
