import axios from "axios";
import {
  appendPostedAlertToJson,
  removeAlertFromJson,
  getPostedAlerts,
  logErrorToFile,
  initializeStorage,
} from "./storage.js";
import { parsePost } from "./textHandlers.js";

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
    logErrorToFile({ error, method: "getActiveAlertsForZone" });
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
    await axios
      .post(
        `https://${process.env.DOMAIN_NAME}/api/v1/statuses`,
        {
          status: parsePost(alertComponents, alert.id),
        },
        { headers: { Authorization: `Bearer ${process.env.AUTH_TOKEN}` } }
      )
      .then((response) => {
        appendPostedAlertToJson({
          alertId: alert.id,
          statusId: response.data.id,
        });
      });
  } catch (error) {
    logErrorToFile({ error, method: "postAlert" });
  }
};

const postAlerts = async (alerts) =>
  await Promise.all(alerts.map(async (alert) => await postAlert(alert)));

const deleteAlert = async (alert) => {
  try {
    await axios.delete(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses/${alert.statusId}`
    );
    removeAlertFromJson(alert.alertId);
  } catch (error) {
    logErrorToFile({ error, method: "deleteAlert" });
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
    logErrorToFile({ error, method: "deleteInactiveAlerts" });
  }
};

async function main() {
  try {
    initializeStorage();
    const activeAlerts = await getActiveAlertsForZone();
    await deleteInactiveAlerts(activeAlerts);
    await postAlerts(activeAlerts);
  } catch (error) {
    logErrorToFile({ error, method: "main" });
  }
}

main();
setInterval(
  () => main().catch((error) => logErrorToFile({ error, method: "" })),
  30000
);
