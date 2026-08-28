import { useState } from "react";
import { FinancialProvider, useFinancial } from "./context/FinancialContext";
import { GamificationProvider } from "./context/GamificationContext";
import { Navbar } from "./components/Navbar";
import { BobChatWidget } from "./components/BobChatWidget";
import { QuickLogFab } from "./components/QuickLogFab";
import { QuickLogModal } from "./components/QuickLogModal";
import { BadgeCelebrationModal } from "./components/BadgeCelebrationModal";
import { Login } from "./pages/Login";

// Sub-pages tabs
import { Dashboard } from "./pages/Dashboard";
import { Expenses } from "./pages/Expenses";
import { Affordability } from "./pages/Affordability";
import { Loans } from "./pages/Loans";
import { Scholarships } from "./pages/Scholarships";
import { Budget } from "./pages/Budget";
import { Habits } from "./pages/Habits";
import { Advisor } from "./pages/Advisor";

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const { isAuthenticated } = useFinancial();

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard setActiveTab={setActiveTab} onOpenQuickLog={() => setQuickLogOpen(true)} />;
      case "expenses":
        return <Expenses />;
      case "affordability":
        return <Affordability />;
      case "loans":
        return <Loans />;
      case "scholarships":
        return <Scholarships />;
      case "budget":
        return <Budget />;
      case "habits":
        return <Habits />;
      case "advisor":
        return <Advisor />;
      default:
        return <Dashboard setActiveTab={setActiveTab} onOpenQuickLog={() => setQuickLogOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      {/* Universal Sticky Top Nav */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Page Content Wrapper */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {renderActivePage()}
      </main>

      {/* Floating Action Button (FAB) for rapid logs */}
      <QuickLogFab onClick={() => setQuickLogOpen(true)} />

      {/* Quick Log Input Panel Overlay Modal */}
      <QuickLogModal isOpen={quickLogOpen} onClose={() => setQuickLogOpen(false)} />

      {/* Persistent floating AI companion chat window */}
      <BobChatWidget setActiveTab={setActiveTab} />

      {/* Confetti celebrate achievements toast overlays */}
      <BadgeCelebrationModal />
    </div>
  );
}

function App() {
  return (
    <FinancialProvider>
      <GamificationProvider>
        <AppContent />
      </GamificationProvider>
    </FinancialProvider>
  );
}

export default App;
