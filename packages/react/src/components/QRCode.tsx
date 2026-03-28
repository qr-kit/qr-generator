import { useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { generateQR } from '@qr-kit/core';
import type { ErrorCorrectionLevel } from '@qr-kit/core';
import { renderSVG, createQR, applyPreset } from '@qr-kit/dom';
import type { RenderOptions, ModuleShape, ColorConfig, LogoConfig, FinderShape, OverlayImageConfig, CustomModuleArgs, PresetName, FrameConfig } from '@qr-kit/dom';

export interface QRCodeProps {
  value: string;
  size?: number;
  errorCorrection?: ErrorCorrectionLevel;
  version?: number;
  fgColor?: ColorConfig;
  bgColor?: string;
  bgOpacity?: number;
  borderRadius?: number;
  shape?: ModuleShape;
  moduleScale?: number;
  customModule?: (args: CustomModuleArgs) => string | null;
  margin?: number;
  logo?: LogoConfig;
  overlayImage?: OverlayImageConfig;
  finderShape?: FinderShape;
  finderColor?: ColorConfig;
  finderOuterColor?: ColorConfig;
  finderInnerColor?: ColorConfig;
  finderOuterShape?: FinderShape;
  finderInnerShape?: FinderShape;
  frame?: FrameConfig;
  preset?: PresetName;
  skipValidation?: boolean;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface QRCodeHandle {
  /** Trigger a file download in the browser. */
  download(filename?: string): void;
  /** Get the QR code as a Blob. Browser-only. */
  toBlob(): Blob;
  /** Get the QR code as a data URL string. */
  toDataURL(): string;
  /** Access the underlying DOM element. */
  element: HTMLDivElement | null;
}

export const QRCode = forwardRef<QRCodeHandle, QRCodeProps>(
  function QRCode(props, ref) {
    const {
      value,
      size = 256,
      errorCorrection,
      version,
      fgColor,
      bgColor,
      bgOpacity,
      borderRadius,
      shape,
      moduleScale,
      customModule,
      margin,
      logo,
      overlayImage,
      finderShape,
      finderColor,
      finderOuterColor,
      finderInnerColor,
      finderOuterShape,
      finderInnerShape,
      frame,
      preset,
      skipValidation,
      alt,
      className,
      style,
    } = props;

    const divRef = useRef<HTMLDivElement>(null);

    const svgString = useMemo(() => {
      // Auto-upgrade EC to H when logo or overlay is present
      const ec: ErrorCorrectionLevel = (logo || overlayImage) ? 'H' : (errorCorrection ?? 'M');
      const qr = generateQR({ data: value, errorCorrection: ec, version });

      // Merge preset options first, then explicit props win.
      // Filter out undefined values so they don't overwrite preset settings.
      const presetOpts = preset ? applyPreset(preset) : {};

      const explicitOpts: Record<string, unknown> = {
        size, fgColor, bgColor, bgOpacity, borderRadius, shape, moduleScale,
        customModule, margin, logo, overlayImage, finderShape, finderColor,
        finderOuterColor, finderInnerColor, finderOuterShape, finderInnerShape,
        frame, skipValidation,
      };
      // Remove undefined keys so preset values are preserved
      for (const key of Object.keys(explicitOpts)) {
        if (explicitOpts[key] === undefined) delete explicitOpts[key];
      }

      const renderOpts: RenderOptions = {
        ...presetOpts,
        ...explicitOpts,
        moduleTypes: qr.moduleTypes,
      } as RenderOptions;

      return renderSVG(qr.matrix, renderOpts);
    }, [value, size, errorCorrection, version, fgColor, bgColor, bgOpacity, borderRadius, shape, moduleScale, customModule, margin, logo, overlayImage, finderShape, finderColor, finderOuterColor, finderInnerColor, finderOuterShape, finderInnerShape, frame, preset, skipValidation]);

    useImperativeHandle(ref, () => {
      const buildOpts = () => {
        const presetOpts = preset ? applyPreset(preset) : {};
        const explicit: Record<string, unknown> = {
          size, fgColor, bgColor, bgOpacity, borderRadius, shape, moduleScale,
          customModule, margin, logo, overlayImage, finderShape, finderColor,
          finderOuterColor, finderInnerColor, finderOuterShape, finderInnerShape,
          frame, skipValidation,
        };
        for (const key of Object.keys(explicit)) {
          if (explicit[key] === undefined) delete explicit[key];
        }
        return { ...presetOpts, ...explicit } as RenderOptions;
      };
      return {
      download(filename?: string) {
        const result = createQR(value, buildOpts(),
          { errorCorrection: (logo || overlayImage) ? 'H' : (errorCorrection ?? 'M'), version });
        result.download({ filename });
      },
      toBlob() {
        const result = createQR(value, buildOpts(),
          { errorCorrection: (logo || overlayImage) ? 'H' : (errorCorrection ?? 'M'), version });
        return result.toBlob('svg');
      },
      toDataURL() {
        const result = createQR(value, buildOpts(),
          { errorCorrection: (logo || overlayImage) ? 'H' : (errorCorrection ?? 'M'), version });
        return result.toDataURL('svg');
      },
      get element() {
        return divRef.current;
      },
    }; }, [value, size, errorCorrection, version, fgColor, bgColor, bgOpacity, borderRadius, shape, moduleScale, customModule, margin, logo, overlayImage, finderShape, finderColor, finderOuterColor, finderInnerColor, finderOuterShape, finderInnerShape, frame, preset, skipValidation]);

    const ariaLabel = alt !== undefined ? alt : 'QR Code';

    return (
      <div
        ref={divRef}
        role="img"
        aria-label={ariaLabel}
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    );
  },
);
