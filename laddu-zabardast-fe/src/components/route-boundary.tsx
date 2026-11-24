import { Component, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ErrorState } from "@/components/store-feedback";

class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="mx-auto max-w-lg px-4 py-10"><ErrorState message="This page could not be opened. Check your connection and try again." onRetry={() => window.location.reload()} /></div> : this.props.children;
  }
}
export function RouteBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <PageBoundary key={location.pathname + location.search}>{children}</PageBoundary>;
}
