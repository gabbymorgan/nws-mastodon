import axios from "axios";
import dotenv from "dotenv";
import {
  appendPostedAlertToJson,
  removeAlertFromJson,
  getPostedAlerts,
} from "./storage.js";

dotenv.config();

axios.defaults.headers.common[
  "Authorization"
] = `Bearer ${process.env.AUTH_TOKEN}`;

const getActiveAlertsForZone = async () => {
  const getActiveAlertsForZoneResponse = await axios.get(
    `https://api.weather.gov/alerts/active?zone=${process.env.NWS_ALERT_ZONE}`,
    { headers: { "User-Agent": process.env.NWS_API_USER_AGENT } }
  );
  return getActiveAlertsForZoneResponse.data.features;
};

const postAlert = async (alert) => {
  const postedAlerts = getPostedAlerts();
  if (postedAlerts.find((postedAlert) => postedAlert.alertId === alert.id)) {
    return;
  }
  await axios
    .post(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses`,
      { status: alert.properties.description },
      { headers: { Authorization: `Bearer ${process.env.AUTH_TOKEN}` } }
    )
    .then((response) => {
      appendPostedAlertToJson({
        alertId: alert.id,
        statusId: response.data.id,
      });
    })
    .catch((error) => console.log(error.response));
};

const postAlerts = async (alertIds) =>
  await Promise.all(alertIds.map(async (alert) => await postAlert(alert)));

const deleteAlert = async (alert) => {
  await axios.delete(
    `https://${process.env.DOMAIN_NAME}/api/v1/statuses/${alert.statusId}`
  );
  removeAlertFromJson(alert.alertId);
  console.log(alert + " removed!");
};

const deleteInactiveAlerts = async (activeAlertIds) => {
  const postedAlerts = getPostedAlerts();
  const inactivePostedAlerts = [...postedAlerts].filter((postedAlert) =>
    activeAlertIds.includes(postedAlert.alertId)
  );

  return await Promise.all(
    inactivePostedAlerts.map(
      async (inactiveAlertId) => await deleteAlert(inactiveAlertId)
    )
  );
};

async function main() {
  const activeAlertIds = await getActiveAlertsForZone();
  await deleteInactiveAlerts(activeAlertIds);
  await postAlerts(activeAlertIds);
}

main();
setInterval(() => main().catch((err) => console.log(err)), 30000);
