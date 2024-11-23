import notifee, { Notification } from "@notifee/react-native";
import * as server from "expo-web-server";
import { useEffect, useState } from "react";
import { LogBox, Platform, Text, View } from "react-native";
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

LogBox.ignoreLogs(["[notifee] no background event handler has been set."]);

const isAndroid = Platform.OS === "android";

const notifyStatus = async (body: string, asForegroundService = false) => {
  const channelId = await notifee.createChannel({
    id: asForegroundService ? "ExpoWebServerService" : "ExpoWebServerStatus",
    name: asForegroundService
      ? "Service status update"
      : "Server status updates",
  });
  await notifee.displayNotification({
    title: "Expo-Web-Server",
    body,
    android: { channelId, asForegroundService },
  });
};

const notifyServiceUpdate = async (
  notification: Notification,
  body: string,
) => {
  notifee.displayNotification({
    ...notification,
    body,
  });
};

export default function App() {
  const [lastCalled, setLastCalled] = useState<number | undefined>();

  const html = `
	<!DOCTYPE html>
	<html>
		<body style="background-color:powderblue;">
			<h1>expo-web-server</h1>
			<p>You can load HTML!</p>
		</body>
	</html>`;

  const obj = { app: "expo-web-server", desc: "You can load JSON!" };
  let testFile = FileSystem.documentDirectory + "icon.png";

  const configureServer = async (onServerCalled: () => void) => {
    server.setup(9666, (event: server.StatusEvent) => {
      if (event.status === "ERROR") {
        notifyStatus(`Server error: ${event.message}`);
      } else {
        notifyStatus(`Server status: ${event.status.toLowerCase()}`);
      }
    });
    server.route("/", "GET", async (request) => {
      console.log("Request", "/", "GET", request);
      onServerCalled();
      return {
        statusCode: 200,
        headers: {
          "Custom-Header": "Bazinga",
        },
        contentType: "application/json",
        body: JSON.stringify(obj),
      };
    });
    server.route("/", "POST", async (request) => {
      console.log("Request", "/", "POST", request);
      onServerCalled();
      return {
        statusCode: 200,
        contentType: "application/json",
        body: request.body,
      };
    });
    server.route("/html$", "GET", async (request) => {
      console.log("Request", "/html", "GET", request);
      onServerCalled();
      return {
        statusCode: 200,
        statusDescription: "OK - CUSTOM STATUS",
        contentType: "text/html",
        body: html,
      };
    });
    server.route("/file", "GET", async (request) => {
      onServerCalled();
      return {
        statusCode: 200,
        contentType: "image/png",
        file: testFile,
      };
    });
    server.start();
  };

  useEffect(() => {
    const configure = async () => {
      // configure server
      await notifee.requestPermission();

      if (isAndroid) {
        notifee.registerForegroundService((notification) => {
          return new Promise(() => {
            configureServer(() => {
              setLastCalled(Date.now());
              notifyServiceUpdate(
                notification,
                `Called at ${new Date(Date.now()).toLocaleString()}`,
              );
            });
          });
        });
        notifyStatus("Called at: never", true);
      } else {
        configureServer(() => {
          setLastCalled(Date.now());
        });
      }
      // save temporary file
      await FileSystem.downloadAsync(
        Asset.fromModule(require("./assets/icon.png")).uri,
        testFile,
      );

      console.log('File temporaneo salvato in:', testFile);
    };

    configure();
    return () => {
      if (isAndroid) {
        notifee.stopForegroundService();
      }
      server.stop();
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text>
        {lastCalled === undefined
          ? "Request webserver to change text"
          : "Called at " + new Date(lastCalled).toLocaleString()}
      </Text>
    </View>
  );
}