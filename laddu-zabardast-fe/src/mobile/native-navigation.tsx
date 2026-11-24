import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export function NativeNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    let disposed = false;
    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (disposed) return;
      // Let Radix close a sheet, dialog or select before changing the page.
      const overlay = document.querySelector('[role="dialog"], [role="listbox"], [role="menu"]');
      if (overlay) {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
        return;
      }
      if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup") {
        void App.minimizeApp();
      } else if (canGoBack) {
        navigate(-1);
      } else {
        navigate("/", { replace: true });
      }
    });
    return () => {
      disposed = true;
      void listener.then((handle) => handle.remove());
    };
  }, [location.pathname, navigate]);

  return null;
}
