import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const POSTED_ACTIVE_ALERTS = [];

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
  if (POSTED_ACTIVE_ALERTS.includes(alert.id)) {
    return;
  }
  await axios
    .post(
      `https://${process.env.DOMAIN_NAME}/api/v1/statuses`,
      { status: alert.properties.description },
      { headers: { Authorization: `Bearer ${process.env.AUTH_TOKEN}` } }
    )
    .then((response) => {
      POSTED_ACTIVE_ALERTS.push(alert.id);
      console.log(POSTED_ACTIVE_ALERTS);
    })
    .catch((error) => console.log(error.response));
};

const postAllAlerts = async (alerts) =>
  await Promise.all(alerts.map(async (alert) => await postAlert(alert)));

async function main() {
  const activeAlerts = await getActiveAlertsForZone();
  await postAllAlerts(activeAlerts);
}

setInterval(() => main().catch((err) => console.log(err)), 5000);
