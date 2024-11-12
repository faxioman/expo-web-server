import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { ExpoWebServerViewProps } from './ExpoWebServer.types';

const NativeView: React.ComponentType<ExpoWebServerViewProps> =
  requireNativeViewManager('ExpoWebServer');

export default function ExpoWebServerView(props: ExpoWebServerViewProps) {
  return <NativeView {...props} />;
}
