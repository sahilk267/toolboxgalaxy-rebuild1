// Orbital Workbench: route map for the tools hub, game bay, honest contact route, and verified modules.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import PwaUpdateNotice from "@/components/PwaUpdateNotice";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Contact from "@/pages/Contact";
import Games from "@/pages/Games";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Tools from "@/pages/Tools";
import ToolWorkspace from "@/pages/ToolWorkspace";
import DocumentStudio from "@/pages/DocumentStudio";
import Guides from "@/pages/Guides";
import GuideDetail from "@/pages/GuideDetail";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

function PageViewTracker() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return null;
}

const OrbitDash = lazy(() => import("@/pages/OrbitDash"));
const LogicLab = lazy(() => import("@/pages/LogicLab"));
const LogicPuzzle = lazy(() => import("@/pages/LogicPuzzle"));

function GameRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="game-route-loading"><span className="status-dot" /> Loading Orbit Dash…</div>}>
        <OrbitDash />
      </Suspense>
    </ErrorBoundary>
  );
}

function LogicLabRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="game-route-loading"><span className="status-dot" /> Loading Logic Lab…</div>}>
        <LogicLab />
      </Suspense>
    </ErrorBoundary>
  );
}

function LogicPuzzleRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="game-route-loading"><span className="status-dot" /> Loading puzzle module…</div>}>
        <LogicPuzzle />
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <LanguageProvider>
          <TooltipProvider>
            <PageViewTracker />
            <Toaster theme="dark" position="bottom-right" />
            <PwaUpdateNotice />
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/studio" component={DocumentStudio} />
              <Route path="/pdf-studio" component={DocumentStudio} />
              <Route path="/document-studio" component={DocumentStudio} />
              <Route path="/tools" component={Tools} />
              <Route path="/tools/:slug" component={ToolWorkspace} />
              <Route path="/guides" component={Guides} />
              <Route path="/guides/:slug" component={GuideDetail} />
              <Route path="/games" component={Games} />
              <Route path="/games/orbit-dash" component={GameRoute} />
              <Route path="/games/logic-lab" component={LogicLabRoute} />
              <Route path="/games/:slug" component={LogicPuzzleRoute} />
              <Route path="/games/logic/:slug" component={LogicPuzzleRoute} />
              <Route path="/contact" component={Contact} />
              <Route path="/privacy" component={Privacy} />
              <Route path="/terms" component={Terms} />
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
