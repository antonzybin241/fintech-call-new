import React, { useEffect, useState } from "react";
// import { resolveAssetUrl } from '../../utils/assetPath';
// import { ASSET_PATHS } from '../../utils/assetPaths';
// @ts-ignore - Optional peer dependency, handled dynamically at runtime

// Internal component that uses Rive hooks - only rendered when module is loaded
const RiveAnimationInner = ({ useRive, Layout, Fit, animationPath }: {
  useRive: any;
  Layout: any;
  Fit: any;
  animationPath: string;
}) => {
  // Create layout - use Fit.Contain to match original (not Cover which zooms in)
  const layoutConfig = new Layout({
    fit: Fit.Contain,
    alignment: 'Center', // Use string directly instead of Alignment.Center
  });

  const { rive, RiveComponent } = useRive({
    src: animationPath,
    stateMachines: "FoxRaiseUp",
    autoplay: true,
    layout: layoutConfig,
    onLoad: () => {
    },
    onLoadError: (err: Error) => {
    },
  });

  useEffect(() => {
    if (rive) {
      const inputs = rive.stateMachineInputs("FoxRaiseUp");

      if (inputs) {
        const startInput = inputs.find((input: any) => input.name === "Start");
        if (startInput) {
          startInput.fire();
        }
      }

      rive.play();
    }
  }, [rive]);

  return (
    <div style={{ width: '400px', height: '170px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <RiveComponent
        style={{
          width: "400px",
          height: "170px",
          display: "block",
        }}
      />
    </div>
  );
};

export const FoxRiveAnimation = () => {
  const [riveModuleLoaded, setRiveModuleLoaded] = useState(false);
  const [riveComponents, setRiveComponents] = useState<{
    useRive: any;
    Layout: any;
    Fit: any;
  } | null>(null);

  // Get RIV animation URL from config (third-party URL)
  // const FOX_ANIMATION = resolveAssetUrl(ASSET_PATHS.metamaskFoxRiv);
  const FOX_ANIMATION = null;

  // Load the module dynamically at runtime to avoid build-time import issues
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Use dynamic import which works better with bundlers
    // @ts-ignore - Dynamic import for optional peer dependency
    import("@rive-app/react-canvas")
      .then((module: any) => {
        
        // Try different possible export structures
        // Structure 1: Direct exports (useRive, Layout, Fit)
        let useRive = module?.useRive;
        let Layout = module?.Layout;
        let Fit = module?.Fit;
        
        // Structure 2: Default export with named exports
        if (!useRive && module?.default) {
          useRive = module.default.useRive || module.default?.useRive;
          Layout = module.default.Layout || module.default?.Layout;
          Fit = module.default.Fit || module.default?.Fit;
        }
        
        // Structure 3: Named exports from default
        if (!useRive && module?.default) {
          const defaultModule = module.default;
          if (typeof defaultModule === 'object') {
            useRive = defaultModule.useRive;
            Layout = defaultModule.Layout;
            Fit = defaultModule.Fit;
          }
        }
        
        // Structure 4: Check for nested structure (e.g., module.rive.useRive)
        if (!useRive && module?.rive) {
          useRive = module.rive.useRive;
          Layout = module.rive.Layout;
          Fit = module.rive.Fit;
        }
        
        if (useRive && Layout && Fit) {
          setRiveComponents({
            useRive,
            Layout,
            Fit,
          });
          setRiveModuleLoaded(true);
        } else {
        }
      })
      .catch((e) => {
      });
  }, []);

  // If @rive-app/react-canvas is not available, return null
  // This is safe because we're not calling any hooks conditionally
  if (!riveModuleLoaded || !riveComponents) {
    return null;
  }

  // Verify animation path before rendering
  if (!FOX_ANIMATION) {
    return null;
  }

  // Render the inner component that uses Rive hooks
  // This component will always call hooks in the same order
  return (
    <RiveAnimationInner
      useRive={riveComponents.useRive}
      Layout={riveComponents.Layout}
      Fit={riveComponents.Fit}
      animationPath={FOX_ANIMATION}
    />
  );
};
