import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDynamicImportError =
        this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.message?.includes("Importing a module script failed");

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-lg p-6 text-center">
            <AlertTriangle
              size={44}
              className="text-amber-400 mb-4 flex-shrink-0"
            />

            <h2 className="text-xl font-bold mb-2">
              {isDynamicImportError ? "Module Load Interrupted" : "An unexpected error occurred."}
            </h2>

            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {isDynamicImportError
                ? "The game module could not be loaded, which can happen during a connection blip or background update. Click below to reload."
                : "A runtime error occurred while loading this view."}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={this.handleRetry}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
                  "bg-amber-500 text-black",
                  "hover:bg-amber-400 cursor-pointer transition"
                )}
              >
                <RotateCcw size={15} />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
                  "bg-muted text-foreground",
                  "hover:bg-muted/80 cursor-pointer transition"
                )}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
