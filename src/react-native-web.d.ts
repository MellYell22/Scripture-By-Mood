declare module 'react-native' {
  import type { ComponentType } from 'react';

  export type StyleProp<T = Record<string, unknown>> = T | T[] | null | undefined;
  export type ViewStyle = Record<string, unknown>;
  export type TextStyle = Record<string, unknown>;
  export type ImageStyle = Record<string, unknown>;

  export const View: ComponentType<any>;
  export const Text: ComponentType<any>;
  export const TextInput: ComponentType<any>;
  export const TouchableOpacity: ComponentType<any>;
  export const ScrollView: ComponentType<any>;
  export const ActivityIndicator: ComponentType<any>;
  export const FlatList: ComponentType<any>;
  export const KeyboardAvoidingView: ComponentType<any>;
  export const RefreshControl: ComponentType<any>;
  export const Modal: ComponentType<any>;

  export const Alert: {
    alert: (...args: any[]) => void;
  };

  export const Dimensions: {
    get: (dimension: string) => {
      width: number;
      height: number;
      scale: number;
      fontScale: number;
    };
    addEventListener: (...args: any[]) => { remove?: () => void };
  };

  export const Platform: {
    OS: string;
    select: <T>(specifics: Record<string, T>) => T | undefined;
  };

  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
    flatten: (style: any) => any;
    hairlineWidth: number;
    absoluteFillObject: Record<string, unknown>;
  };
}
