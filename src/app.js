import axios from "axios";
import {
  addPostedAlertToJson,
  removeAlertFromJson,
  getPostedAlerts,
  logError,
  initializeStorage,
} from "./storage.js";
import { formatHeadStatus, formatNonheadStatus } from "./textHandlers.js";
import {
  deleteStatus,
  postHeadStatus,
  postNonheadStatus,
} from "./weatherAPI.js";

axios.defaults.headers.common[
  "Authorization"
] = `Bearer ${process.env.AUTH_TOKEN}`;

const getActiveAlertsForZone = async () => {
  try {
    const getActiveAlertsForZoneResponse = await axios.get(
      `https://api.weather.gov/alerts/active?zone=${process.env.NWS_ALERT_ZONE}`,
      { headers: { "User-Agent": process.env.NWS_API_USER_AGENT } }
    );
    return getActiveAlertsForZoneResponse.data.features;
  } catch (error) {
    logError({ error, method: "getActiveAlertsForZone" });
    return [];
  }
};

const postAlert = async (alert) => {
  try {
    const postedAlerts = getPostedAlerts();
    if (postedAlerts.find((postedAlert) => postedAlert.alertId === alert.id)) {
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
    if (formatHeadStatusResponse.error) {
      logError({
        error: formatHeadStatusResponse.error,
        method: "formatHeadStatus",
      });
    }
    messageBody = formatHeadStatusResponse.remainder;
    const postHeadStatusResponse = await postHeadStatus(
      formatHeadStatusResponse.statusMessage
    );
    if (postHeadStatusResponse.error) {
      logError({
        error: postHeadStatusResponse.error,
        method: "postHeadStatus",
      });
      return;
    }
    let previousStatusId = postHeadStatusResponse.response.id;
    const statusIds = [previousStatusId];
    while (messageBody && messageBody.length) {
      const formatNonheadStatusResponse = formatNonheadStatus(messageBody);
      if (formatNonheadStatusResponse.error) {
        logError({
          error: formatNonheadStatusResponse.error,
          method: "formatNonheadStatus",
        });
      }
      const postNonheadStatusResponse = await postNonheadStatus(
        formatNonheadStatusResponse.statusMessage,
        previousStatusId
      );
      if (postNonheadStatusResponse.error) {
        logError({
          error: postNonheadStatusResponse.error,
          method: "postNonheadStatus",
        });
        return;
      }
      previousStatusId = postNonheadStatusResponse.response.id;
      statusIds.push(previousStatusId);
      messageBody = formatNonheadStatusResponse.remainder;
    }
    addPostedAlertToJson(alert.id, statusIds);
  } catch (error) {
    logError({ error, method: "postAlert" });
  }
};

const postAlerts = async (alerts) =>
  await Promise.all(alerts.map(async (alert) => await postAlert(alert)));

const deleteAlert = async (alert) => {
  try {
    for (const statusId of alert.statusIds) {
      await deleteStatus(statusId);
    }
    removeAlertFromJson(alert.alertId);
  } catch (error) {
    logError({ error, method: "deleteAlert" });
  }
};

const deleteInactiveAlerts = async (activeAlerts) => {
  try {
    const postedAlerts = getPostedAlerts();
    // O(n^2), but I'm not going to waste time optimizing for this use case
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
    logError({ error, method: "deleteInactiveAlerts" });
  }
};

async function main() {
  try {
    initializeStorage();
    const activeAlerts = await getActiveAlertsForZone();
    await deleteInactiveAlerts(activeAlerts);
    await postAlerts(activeAlerts);
  } catch (error) {
    logError({ error, method: "main" });
  }
}

main();
setInterval(
  () => main().catch((error) => logError({ error, method: "" })),
  30000
);
