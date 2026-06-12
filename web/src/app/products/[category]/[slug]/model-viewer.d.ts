// Type shim for Google's <model-viewer> web component
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string
      alt?: string
      ar?: string
      'ar-modes'?: string
      'ar-scale'?: string
      'auto-rotate'?: string
      'auto-rotate-delay'?: string
      'rotation-per-second'?: string
      'camera-controls'?: string
      'touch-action'?: string
      'shadow-intensity'?: string
      exposure?: string
      style?: React.CSSProperties & { [key: string]: any }
    }
  }
}
