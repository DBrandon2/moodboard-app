import { useWindowSize } from "../hooks/useWindowSize";

/**
 * DEBUG Component - Shows real-time responsive state
 * THIS IS FOR DIAGNOSIS ONLY - Remove in production
 */
export default function Debug() {
  const windowSize = useWindowSize();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "6rem",
        right: "1rem",
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.8)",
        color: "#0f0",
        padding: "1rem",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "12px",
        maxWidth: "200px",
        wordBreak: "break-all",
        border: "1px solid #0f0",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>📊 DEBUG</div>
      <div>Width: {windowSize.width}px</div>
      <div>Height: {windowSize.height}px</div>
      <div
        style={{
          marginTop: "0.5rem",
          padding: "0.5rem",
          background: windowSize.isMobile ? "#0f0" : "#f00",
          color: "#000",
          borderRadius: "2px",
          fontWeight: "bold",
        }}
      >
        isMobile: {windowSize.isMobile ? "TRUE" : "FALSE"}
      </div>
      <div style={{ marginTop: "0.5rem", fontSize: "10px" }}>
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
