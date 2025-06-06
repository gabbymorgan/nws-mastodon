import axios from "axios";
import {
  addPostedAlertToJson,
  removeAlertFromJson,
  getPostedAlerts,
  logError,
  initializeStorage,
} from "./storage";
import {
  formatErrorLogEntry,
  formatHeadStatus,
  formatNonheadStatus,
} from "./textFormatting";
import { deleteStatus, postHeadStatus, postNonheadStatus } from "./weatherAPI";
import { NWSAlert, PostedAlert } from "./types";

axios.defaults.headers.common[
  "Authorization"
] = `Bearer ${process.env.AUTH_TOKEN}`;

const INTERVAL = Number(process.env.INTERVAL) || 30;

const getActiveAlertsForZone = async (): Promise<NWSAlert[]> => {
  try {
    const getAlertsResponse = await axios.get(
      `https://api.weather.gov/alerts/active?zone=${process.env.NWS_ALERT_ZONE}`,
      { headers: { "User-Agent": process.env.NWS_API_USER_AGENT } }
    );
    return getAlertsResponse.data.features;
  } catch (error) {
    logError(formatErrorLogEntry(error, "getActiveAlertsForZone"));
    return [];
  }
};

const postAlert = async (alert: NWSAlert) => {
  try {
    const postedAlerts = getPostedAlerts();
    if (
      postedAlerts.find(
        (postedAlert: PostedAlert) => postedAlert.alertId === alert.id
      )
    ) {
      return;
    }

    const alertComponents = [alert.properties.headline];
    if (alert.properties.parameters.NWSheadline) {
      alertComponents.push(alert.properties.parameters.NWSheadline[0]);
    }
    if (alert.properties.description) {
      alertComponents.push(alert.properties.description);
    }

    let messageBody = alertComponents.join("\n\n");
    const formatHeadStatusResponse = formatHeadStatus(messageBody, alert.id);
    messageBody = formatHeadStatusResponse.remainder;
    const postHeadStatusResponse = await postHeadStatus(
      formatHeadStatusResponse.formattedText
    );

    let previousStatusId = postHeadStatusResponse.response?.data.id;
    const statusIds = [previousStatusId];

    while (messageBody && messageBody.length) {
      const formatNonheadStatusResponse = formatNonheadStatus(messageBody);

      const postNonheadStatusResponse = await postNonheadStatus(
        formatNonheadStatusResponse.formattedText,
        previousStatusId
      );
      previousStatusId = postNonheadStatusResponse.response?.data.id;
      statusIds.push(previousStatusId);
      messageBody = formatNonheadStatusResponse.remainder;
    }
    addPostedAlertToJson(alert.id, statusIds);
  } catch (error) {
    logError(formatErrorLogEntry(error, "postAlert"));
  }
};

const postAlerts = async (alerts: NWSAlert[]) =>
  await Promise.all(alerts.map(async (alert) => await postAlert(alert)));

const deleteAlert = async (alert: PostedAlert) => {
  try {
    for (const statusId of alert.statusIds) {
      await deleteStatus(statusId);
    }
    removeAlertFromJson(alert.alertId);
  } catch (error) {
    logError(formatErrorLogEntry(error, "deleteAlert"));
  }
};

const deleteInactiveAlerts = async (activeAlerts: NWSAlert[]) => {
  try {
    const postedAlerts = getPostedAlerts();
    const inactivePostedAlerts = [...postedAlerts].filter(
      (postedAlert) =>
        !activeAlerts.find(
          (activeAlert) => activeAlert.id === postedAlert.alertId
        )
    );

    return await Promise.all(
      inactivePostedAlerts.map(
        async (inactiveAlert) => await deleteAlert(inactiveAlert)
      )
    );
  } catch (error) {
    logError(formatErrorLogEntry(error, "deleteInactiveAlerts"));
  }
};

async function main() {
  try {
    console.clear();
    console.log("Initializing storage.");
    initializeStorage();
    console.log("Getting active alerts.");
    const activeAlerts = await getActiveAlertsForZone();
    console.log("Deleting inactive alerts.");
    await deleteInactiveAlerts(activeAlerts);
    console.log("Posting active alerts.");
    await postAlerts(activeAlerts);
    console.log(`Starting again in ${INTERVAL} seconds.`);
  } catch (error) {
    logError(formatErrorLogEntry(error, "main"));
  }
}

main();
setInterval(
  () => main().catch((error) => logError(formatErrorLogEntry(error, "main"))),
  INTERVAL * 1000
);
