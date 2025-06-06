import fs from "fs";
import { PostedAlert } from "./types";
import { formatErrorLogEntry } from "./textFormatting";

export const initializeStorage = () => {
  try {
    if (!fs.existsSync("./data")) {
      fs.mkdirSync("./data");
    }
    if (!fs.existsSync("./data/posted-alerts.json")) {
      fs.writeFileSync("./data/posted-alerts.json", "[]");
    }
    if (!fs.existsSync("./data/errors.log")) {
      fs.writeFileSync("./data/errors.log", "");
    }
  } catch (error) {
    logError(formatErrorLogEntry(error, "initializeStorage"));
  }
};

export const addPostedAlertToJson = (
  alertId: string,
  statusIds: string[]
): void => {
  const newPostedAlert = { alertId, statusIds };
  const postedAlerts = JSON.parse(
    fs.readFileSync("./data/posted-alerts.json", "utf-8")
  );
  postedAlerts.push(newPostedAlert);
  fs.writeFileSync("./data/posted-alerts.json", JSON.stringify(postedAlerts));
};

export const removeAlertFromJson = (alertId: string): void => {
  const postedAlerts = getPostedAlerts();
  const updatedAlerts = [...postedAlerts].filter(
    (postedAlert) => postedAlert.alertId !== alertId
  );
  fs.writeFileSync("./data/posted-alerts.json", JSON.stringify(updatedAlerts));
};

export const getPostedAlerts = (): PostedAlert[] =>
  JSON.parse(fs.readFileSync("./data/posted-alerts.json", "utf-8"));

export const logError = (errorLogEntry: string): void => {
  fs.appendFileSync("./data/errors.log", errorLogEntry);
};
