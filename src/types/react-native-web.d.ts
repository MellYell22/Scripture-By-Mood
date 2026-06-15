declare module 'react-native' {
  import * as React from 'react';

  type AnyProps = Record<string, any>;

  export class View extends React.Component<AnyProps> {
    measureLayout(...args: any[]): void;
  }

  export class ScrollView extends React.Component<AnyProps> {
    scrollTo(...args: any[]): void;
    scrollToEnd(...args: any[]): void;
    getInnerViewNode(): any;
    measureLayout(...args: any[]): void;
  }

  export class FlatList<ItemT = any> extends React.Component<AnyProps & { data?: ItemT[] }> {}

  export const Text: React.ComponentType<AnyProps>;
  export const TextInput: React.ComponentType<AnyProps>;
  export const TouchableOpacity: React.ComponentType<AnyProps>;
  export const ActivityIndicator: React.ComponentType<AnyProps>;
  export const KeyboardAvoidingView: React.ComponentType<AnyProps>;
  export const RefreshControl: React.ComponentType<AnyProps>;
  export const Modal: React.ComponentType<AnyProps>;

  export const Alert: {
    alert: (...args: any[]) => void;
  };

  export const Platform: {
    OS: string;
    select: <T>(values: Record<string, T>) => T | undefined;
  };

  export const Dimensions: {
    get: (dimension: string) => {
      width: number;
      height: number;
      scale: number;
      fontScale: number;
    };
    addEventListener: (...args: any[]) => any;
  };

  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
    flatten: (...args: any[]) => any;
    hairlineWidth: number;
    absoluteFillObject: AnyProps;
  };
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
