"use client";

import { Component } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">Không thể hiển thị nội dung này</p>
          <Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false, error: null })}>
            Thử lại
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
