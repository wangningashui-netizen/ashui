import { useState, useCallback, useRef } from "react";

export interface Scene {
  id: string;
  name: string;
  elements: readonly any[];
  appState: Record<string, any> | null;
}

let sceneCounter = 0;
function makeScene(name?: string): Scene {
  sceneCounter++;
  return {
    id: `scene-${sceneCounter}-${Date.now()}`,
    name: name || `Scene ${sceneCounter}`,
    elements: [],
    appState: null,
  };
}

export function useScenes() {
  const [scenes, setScenes] = useState<Scene[]>(() => [makeScene("Scene 1")]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const excalidrawAPIRef = useRef<any>(null);

  const saveCurrentScene = useCallback(() => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    const elements = api.getSceneElements();
    const appState = api.getAppState();
    setScenes((prev) => {
      const next = [...prev];
      next[currentIndex] = {
        ...next[currentIndex],
        elements: [...elements],
        appState: {
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom,
        },
      };
      return next;
    });
  }, [currentIndex]);

  const loadScene = useCallback(
    (index: number) => {
      const api = excalidrawAPIRef.current;
      if (!api) return;
      const scene = scenes[index];
      if (!scene) return;

      setTransitioning(true);
      setTimeout(() => {
        api.updateScene({
          elements: scene.elements,
        });
        if (scene.appState) {
          api.scrollToContent(undefined, { fitToViewport: false });
        }
        setTransitioning(false);
      }, 150);
    },
    [scenes]
  );

  const goToScene = useCallback(
    (index: number) => {
      if (index < 0 || index >= scenes.length || index === currentIndex) return;
      saveCurrentScene();
      setCurrentIndex(index);
      loadScene(index);
    },
    [scenes.length, currentIndex, saveCurrentScene, loadScene]
  );

  const nextScene = useCallback(() => {
    if (currentIndex < scenes.length - 1) {
      goToScene(currentIndex + 1);
    }
  }, [currentIndex, scenes.length, goToScene]);

  const prevScene = useCallback(() => {
    if (currentIndex > 0) {
      goToScene(currentIndex - 1);
    }
  }, [currentIndex, goToScene]);

  const addScene = useCallback(() => {
    saveCurrentScene();
    const newScene = makeScene();
    setScenes((prev) => {
      const next = [...prev];
      next.splice(currentIndex + 1, 0, newScene);
      return next;
    });
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    // Clear canvas for new scene
    const api = excalidrawAPIRef.current;
    if (api) {
      api.updateScene({ elements: [] });
      api.scrollToContent(undefined, { fitToViewport: false });
    }
  }, [saveCurrentScene, currentIndex]);

  const deleteScene = useCallback(
    (index: number) => {
      if (scenes.length <= 1) return;
      setScenes((prev) => prev.filter((_, i) => i !== index));
      if (currentIndex >= index && currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        loadScene(newIndex);
      } else if (currentIndex === index) {
        loadScene(Math.min(currentIndex, scenes.length - 2));
      }
    },
    [scenes.length, currentIndex, loadScene]
  );

  const duplicateScene = useCallback(() => {
    saveCurrentScene();
    const current = scenes[currentIndex];
    const dupe: Scene = {
      ...makeScene(`${current.name} copy`),
      elements: [...current.elements],
      appState: current.appState ? { ...current.appState } : null,
    };
    setScenes((prev) => {
      const next = [...prev];
      next.splice(currentIndex + 1, 0, dupe);
      return next;
    });
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [saveCurrentScene, scenes, currentIndex]);

  return {
    scenes,
    currentIndex,
    transitioning,
    excalidrawAPIRef,
    goToScene,
    nextScene,
    prevScene,
    addScene,
    deleteScene,
    duplicateScene,
    saveCurrentScene,
  };
}
