declare module 'react-native' {
  import * as React from 'react';

  type NativeWebProps = Record<string, any> & {
    children?: React.ReactNode;
    style?: any;
  };

  export class ActivityIndicator extends React.Component<NativeWebProps> {}
  export class FlatList<ItemT = any> extends React.Component<NativeWebProps & {
    data?: ItemT[];
    renderItem?: (info: { item: ItemT; index: number }) => React.ReactElement | null;
  }> {}
  export class KeyboardAvoidingView extends React.Component<NativeWebProps> {}
  export class Modal extends React.Component<NativeWebProps> {}
  export class RefreshControl extends React.Component<NativeWebProps> {}
  export class ScrollView extends React.Component<NativeWebProps> {
    scrollTo: (options?: { x?: number; y?: number; animated?: boolean }) => void;
    scrollToEnd: (options?: { animated?: boolean }) => void;
    getInnerViewNode: () => any;
  }
  export class Text extends React.Component<NativeWebProps> {}
  export class TextInput extends React.Component<NativeWebProps> {}
  export class TouchableOpacity extends React.Component<NativeWebProps> {}
  export class View extends React.Component<NativeWebProps> {
    measureLayout: (
      relativeToNativeNode: any,
      onSuccess: (x: number, y: number, width: number, height: number) => void,
      onFail?: () => void,
    ) => void;
  }

  export const Alert: {
    alert: (title: string, message?: string, buttons?: any[], options?: any) => void;
  };

  export const Dimensions: {
    get: (dimension: 'window' | 'screen') => {
      width: number;
      height: number;
      scale: number;
      fontScale: number;
    };
  };

  export const Platform: {
    OS: string;
    select: <T>(specifics: {
      web?: T;
      ios?: T;
      android?: T;
      native?: T;
      default?: T;
    }) => T | undefined;
  };

  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
    flatten: (style?: any) => any;
  };
}
