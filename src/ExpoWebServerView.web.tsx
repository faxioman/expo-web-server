import * as React from 'react';

import { ExpoWebServerViewProps } from './ExpoWebServer.types';

export default function ExpoWebServerView(props: ExpoWebServerViewProps) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
