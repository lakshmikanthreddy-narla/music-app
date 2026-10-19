declare var require: any;
declare var __DEV__: boolean;
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';

import 'lucide-react-native';

declare module 'lucide-react-native' {
  interface LucideProps {
    color?: string;
    size?: number | string;
    strokeWidth?: number | string;
    fill?: string;
    style?: any;
  }
}

declare module 'react-native-svg' {
  import * as React from 'react';
  export interface SvgProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    children?: React.ReactNode;
    style?: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
  }
  export const Svg: React.ComponentType<SvgProps>;
  export const Circle: React.ComponentType<any>;
  export const Defs: React.ComponentType<any>;
  export const LinearGradient: React.ComponentType<any>;
  export const RadialGradient: React.ComponentType<any>;
  export const Stop: React.ComponentType<any>;
  export const Path: React.ComponentType<any>;
  export const G: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const TSpan: React.ComponentType<any>;
  export const TextPath: React.ComponentType<any>;
  export const Rect: React.ComponentType<any>;
  export const Line: React.ComponentType<any>;
  export default Svg;
}



