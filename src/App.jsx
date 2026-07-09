import Canvas from "./components/Canvas/Canvas";
import Toolbar from "./components/Canvas/Toolbar";
import { useState } from "react";
import { useWindowSize } from "./hooks/useWindowSize";

function App() {
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);
  const windowSize = useWindowSize();

  const handleRecenter = () => {
    setOffsetX(0);
    setOffsetY(0);
    setScale(1);
  };

  return (
    <div
      className="w-screen h-screen select-none relative"
      style={{
        paddingBottom: 0,
      }}
    >
      <Toolbar
        onRecenter={handleRecenter}
        offsetX={offsetX}
        offsetY={offsetY}
        canvasScale={scale}
        isMobile={windowSize.isMobile}
      />
      <Canvas
        isMobile={windowSize.isMobile}
        offsetX={offsetX}
        setOffsetX={setOffsetX}
        offsetY={offsetY}
        setOffsetY={setOffsetY}
        scale={scale}
        setScale={setScale}
      />
    </div>
  );
}

export default App;
