import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to ExpoWebServer.web.ts
// and on native platforms to ExpoWebServer.ts
import ExpoWebServerModule from './ExpoWebServerModule';
import ExpoWebServerView from './ExpoWebServerView';
import { ChangeEventPayload, ExpoWebServerViewProps } from './ExpoWebServer.types';

// Get the native constant value.
export const PI = ExpoWebServerModule.PI;

export function hello(): string {
  return ExpoWebServerModule.hello();
}

export async function setValueAsync(value: string) {
  return await ExpoWebServerModule.setValueAsync(value);
}

const emitter = new EventEmitter(ExpoWebServerModule ?? NativeModulesProxy.ExpoWebServer);

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export { ExpoWebServerView, ExpoWebServerViewProps, ChangeEventPayload };
