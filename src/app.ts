import fs from 'fs';
import axios from "axios";
import express from "express";
import cors from "cors";
import {
  addPostedAlertToJson,
  removeAlertFromJson,
  getPostedAlerts,
  logError,
  initializeStorage,
  purgePostedAlerts,
  purgeErrorLog,
} from "./storage";
import {
  formatErrorLogEntry,
  formatHeadStatus,
  formatNonheadStatus,
} from "./textFormatting";
import { deleteStatus, getAllStatuses, postHeadStatus, postNonheadStatus } from "./mastodonAPI";
import { NWSAlert, PostedAlert } from "./types";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "http://localhost";
const api = express()

api.use(cors({
    origin: HOST // Allow requests only from this origin
}));

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
      console.log("alert already posted")
      return;
    }

    // else return

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

    if (!postHeadStatusResponse.success) {
      throw(postHeadStatusResponse.error)
    }

    let previousStatusId = postHeadStatusResponse?.response.data.id;
    const statusIds = [previousStatusId];

    while (messageBody && messageBody.length) {
      const formatNonheadStatusResponse = formatNonheadStatus(messageBody);

      const postNonheadStatusResponse = await postNonheadStatus(
        formatNonheadStatusResponse.formattedText,
        previousStatusId
      );
      previousStatusId = postNonheadStatusResponse?.response.data.id;
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

const purgeAllStatuses = async () => {
  try {
    const getAllStatusesResponse = await getAllStatuses(process.env.ACCOUNT_ID);
    const statuses = getAllStatusesResponse?.response.data;
    if (statuses && statuses.length) {
      await Promise.all(statuses.map(async (status) => await deleteStatus(status.id)));
    }
  }
  catch (error) {
    logError(formatErrorLogEntry(error, "purgeAllStatuses"))
  }
}

const purgeStatusLogs = () => {

}

async function main() {
  try {
    console.clear();
    console.log(new Date().toString())
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

let loopIsLooping = false;
let mainLoop;

const initiateMainLoop = async () => {
  loopIsLooping = true;
  await main();
  mainLoop = setInterval(main, INTERVAL * 1000);
}

api.get('/', (req, res) => {
  const dashboard = fs.readFileSync('./src/dashboard.html', 'utf-8')
  res.status(200).send(dashboard);
});

api.post('/start', async (req, res) => {
  await initiateMainLoop();
  res.status(200).json({message: "OK!"})
})

api.post('/stop', async (req, res) => {
  clearInterval(mainLoop);
  loopIsLooping = false;
  res.status(200).json({message: "OK!"})
})

api.post('/purgeAllStatuses', async (req, res) => {
  await purgeAllStatuses();
  res.status(200).json({message: "OK!"})
})

api.post("/purgePostedAlertsLog", async (req, res) => {
  await purgePostedAlerts();
  res.status(200).json({message: "OK!"})
})

api.post("/purgeErrors", async (req, res) => {
  await purgeErrorLog();
  res.status(200).json({message: "OK!"})
})

api.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});