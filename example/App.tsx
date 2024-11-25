import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as server from "expo-web-server";
import { Request } from "expo-web-server/ExpoWebServer.types";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function App() {
  const testFile = FileSystem.documentDirectory + "icon.png";

  useEffect(() => {
    const configure = async () => {
      // save temporary file
      await FileSystem.downloadAsync(
        Asset.fromModule(require("./assets/icon.png")).uri,
        testFile,
      );
    };

    server.start(8005, (request: Request) => {
      if (request.path.startsWith("/file")) {
        return {
          requestId: request.requestId,
          statusCode: 200,
          contentType: "image/png",
          file: testFile,
        };
      } else {
        return {
          requestId: request.requestId,
          statusCode: 200,
          contentType: "application/json",
          body: request.body,
        };
      }
    });

    configure();
    return () => {
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
      <Text>Atlantis is calling!</Text>
    </View>
  );
}