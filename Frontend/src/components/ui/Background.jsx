import React, { useEffect } from 'react';
import UnicornScene from 'unicornstudio-react';
import cleanSceneData from './cleanScene.json';

const SCRIPT_ID = 'unicorn-clean-scene-data';

export default function Background({ className = '', style = {}, ...props }) {
  useEffect(() => {
    // Ensure the embedded JSON script element exists in the DOM so UnicornStudio reads it synchronously
    let scriptEl = document.getElementById(SCRIPT_ID);
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = SCRIPT_ID;
      scriptEl.type = 'application/json';
      scriptEl.textContent = JSON.stringify(cleanSceneData);
      document.body.appendChild(scriptEl);
    } else {
      scriptEl.textContent = JSON.stringify(cleanSceneData);
    }
  }, []);

  const handleSceneRef = (scene) => {
    if (scene) {
      try {
        // Guarantee any shape/perimeter layer is hidden at runtime
        scene.getLayer?.('shape')?.hide?.();
        scene.getLayer?.('763ac10c-5abf-4028-996f-86670598315e')?.hide?.();
        const layers = scene.getLayers ? scene.getLayers() : [];
        layers.forEach((layer) => {
          if (
            layer.type === 'shape' ||
            layer.publicId === 'shape' ||
            layer.id === '763ac10c-5abf-4028-996f-86670598315e'
          ) {
            scene.getLayer?.(layer.id)?.hide?.();
          }
        });
      } catch (err) {
        // safe ignore
      }
    }
    if (props.sceneRef) {
      if (typeof props.sceneRef === 'function') {
        props.sceneRef(scene);
      } else if (props.sceneRef && 'current' in props.sceneRef) {
        props.sceneRef.current = scene;
      }
    }
  };

  return (
    <div className={`fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none ${className}`} style={style}>
      <UnicornScene
        jsonFilePath={SCRIPT_ID}
        width="100%"
        height="100vh"
        sceneRef={handleSceneRef}
        {...props}
      />
    </div>
  );
}
