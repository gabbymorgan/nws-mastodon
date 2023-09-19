import axios from "axios";
import {
  appendPostedAlertToJson,
  removeAlertFromJson,
  getPostedAlerts,
} from "./storage.js";
import { parseDescription } from "./textHandlers.js";

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
  } catch (err) {
    console.log(err);
  }
};

const postAlert = async (alert) => {
  try {
    const postedAlerts = getPostedAlerts();
    if (postedAlerts.find((postedAlert) => postedAlert.alertId === alert.id)) {
      return;
    }
    await axios
      .post(
        `https://${process.env.DOMAIN_NAME}/api/v1/statuses`,
        { status: parseDescription(alert.properties.description) },
        { headers: { Authorization: `Bearer ${process.env.AUTH_TOKEN}` } }
      )
      .then((response) => {
        appendPostedAlertToJson({
          alertId: alert.id,
          statusId: response.data.id,
        });
      });
  } catch (err) {
    console.log(err);
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
  } catch (err) {
    console.log(err);
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
  } catch (err) {
    console.log(err);
  }
};

async function main() {
  try {
    const activeAlerts = await getActiveAlertsForZone();
    await deleteInactiveAlerts(activeAlerts);
    await postAlerts(activeAlerts);
  } catch (err) {
    console.log(err);
  }
}

main();
setInterval(() => main().catch((err) => console.log(err)), 30000);
