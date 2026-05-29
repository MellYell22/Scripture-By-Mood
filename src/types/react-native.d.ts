declare module 'react-native' {
  import type * as React from 'react';

  export type StyleProp<T = any> = T | T[] | null | undefined;

  export const ActivityIndicator: React.ComponentType<any>;
  export const FlatList: React.ComponentType<any>;
  export const KeyboardAvoidingView: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;
  export const RefreshControl: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const TextInput: React.ComponentType<any>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const View: React.ComponentType<any>;

  export const Alert: {
    alert: (...args: any[]) => void;
  };

  export const Dimensions: {
    get: (dimension: 'window' | 'screen') => { width: number; height: number; scale: number; fontScale: number };
  };

  export const Platform: {
    OS: string;
    select: <T>(specifics: Record<string, T>) => T;
  };

  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
    flatten: (style?: StyleProp) => any;
    hairlineWidth: number;
    absoluteFillObject: Record<string, any>;
  };
}
