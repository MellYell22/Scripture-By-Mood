declare module 'react-native' {
  import type * as React from 'react';

  export type StyleProp<T = Record<string, unknown>> = T | T[] | null | undefined;

  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any> & {
    prototype: {
      scrollTo?: (options: any) => void;
      getInnerViewNode?: () => any;
      measureLayout?: (...args: any[]) => void;
    };
  };
  export const TextInput: React.ComponentType<any>;
  export const ActivityIndicator: React.ComponentType<any>;
  export const RefreshControl: React.ComponentType<any>;
  export const KeyboardAvoidingView: React.ComponentType<any>;
  export const FlatList: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;

  export const Alert: {
    alert: (...args: any[]) => void;
  };

  export const Platform: {
    OS: 'web' | 'ios' | 'android' | string;
    select: <T>(values: Record<string, T>) => T | undefined;
  };

  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
    flatten: <T>(style: StyleProp<T>) => T;
    absoluteFillObject: Record<string, any>;
  };
}
