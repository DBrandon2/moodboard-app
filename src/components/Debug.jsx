import { useWindowSize } from "../hooks/useWindowSize";
import { useEffect, useState } from "react";

/**
 * DEBUG Component - Shows real-time responsive state
 * THIS IS FOR DIAGNOSIS ONLY - Remove in production
 */
export default function Debug() {
  const windowSize = useWindowSize();
  const [toolbarInfo, setToolbarInfo] = useState(null);

  useEffect(() => {
    // Check toolbar element and its styles
    const toolbar = document.querySelector(".toolbar");
    
    if (toolbar) {
      const styles = window.getComputedStyle(toolbar);
      setToolbarInfo({
        exists: true,
        childrenCount: toolbar.children.length,
        display: styles.display,
        position: styles.position,
        bottom: styles.bottom,
        top: styles.top,
        left: styles.left,
        width: styles.width,
        height: styles.height,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        backgroundColor: styles.backgroundColor,
      });
    } else {
      setToolbarInfo({ exists: false });
    }
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "6rem",
        right: "1rem",
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.9)",
        color: "#0f0",
        padding: "1rem",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "11px",
        maxWidth: "280px",
        wordBreak: "break-all",
        border: "2px solid #0f0",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "0.8rem", fontSize: "13px" }}>
        📊 DEBUG INFO
      </div>

      {/* Window Size */}
      <div style={{ marginBottom: "0.8rem", paddingBottom: "0.8rem", borderBottom: "1px solid #0f0" }}>
        <div style={{ fontWeight: "bold", color: "#0ff" }}>Window Size:</div>
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
      </div>

      {/* Toolbar Info */}
      <div style={{ marginBottom: "0.5rem" }}>
        <div style={{ fontWeight: "bold", color: "#0ff" }}>Toolbar Element:</div>
        {toolbarInfo ? (
          <>
            <div style={{ color: toolbarInfo.exists ? "#0f0" : "#f00" }}>
              Status: {toolbarInfo.exists ? "✅ EXISTS" : "❌ MISSING"}
            </div>
            {toolbarInfo.exists && (
              <>
                <div style={{ marginTop: "0.5rem", fontSize: "10px" }}>
                  <div>Children: {toolbarInfo.childrenCount}</div>
                  <div style={{ marginTop: "0.3rem", color: "#0ff" }}>Computed Styles:</div>
                  <div>display: {toolbarInfo.display}</div>
                  <div>position: {toolbarInfo.position}</div>
                  <div>bottom: {toolbarInfo.bottom}</div>
                  <div>top: {toolbarInfo.top}</div>
                  <div>left: {toolbarInfo.left}</div>
                  <div>width: {toolbarInfo.width}</div>
                  <div>height: {toolbarInfo.height}</div>
                  <div>visibility: {toolbarInfo.visibility}</div>
                  <div>opacity: {toolbarInfo.opacity}</div>
                  <div>zIndex: {toolbarInfo.zIndex}</div>
                  <div style={{
                    backgroundColor: toolbarInfo.backgroundColor,
                    padding: "0.2rem",
                    marginTop: "0.3rem",
                    borderRadius: "2px",
                    color: "#fff",
                    fontSize: "9px"
                  }}>
                    bgColor: {toolbarInfo.backgroundColor}
                  </div>
                </div>

                {/* Auto-detect issues */}
                <div style={{ marginTop: "0.8rem", color: "#ff0", fontSize: "9px" }}>
                  {toolbarInfo.display === "none" && (
                    <div>⚠️ display: none - Element hidden!</div>
                  )}
                  {toolbarInfo.visibility === "hidden" && (
                    <div>⚠️ visibility: hidden - Invisible!</div>
                  )}
                  {toolbarInfo.opacity === "0" && (
                    <div>⚠️ opacity: 0 - Transparent!</div>
                  )}
                  {toolbarInfo.bottom === "auto" && toolbarInfo.top !== "auto" && (
                    <div>⚠️ bottom: auto (top mode) - Check mobile flag!</div>
                  )}
                  {toolbarInfo.height === "100%" && (
                    <div>⚠️ height: 100% (full) - Desktop mode active?</div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div>Loading...</div>
        )}
      </div>

      <div style={{ marginTop: "0.8rem", fontSize: "9px", opacity: 0.7 }}>
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
