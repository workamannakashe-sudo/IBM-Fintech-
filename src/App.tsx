import { useState } from "react";
import { FinancialProvider, useFinancial } from "./context/FinancialContext";
import { GamificationProvider } from "./context/GamificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Sidebar } from "./components/Sidebar";
import { TopHeader } from "./components/TopHeader";
import { BobChatWidget } from "./components/BobChatWidget";
import { QuickLogFab } from "./components/QuickLogFab";
import { QuickLogModal } from "./components/QuickLogModal";
import { BadgeCelebrationModal } from "./components/BadgeCelebrationModal";
import { Login } from "./pages/Login";

// Sub-pages tabs
import { Dashboard } from "./pages/Dashboard";
import { Expenses } from "./pages/Expenses";
import { Affordability } from "./pages/Affordability";
import { SplitBill } from "./pages/SplitBill";
import { Loans } from "./pages/Loans";
import { Scholarships } from "./pages/Scholarships";
import { Budget } from "./pages/Budget";
import { Habits } from "./pages/Habits";
import { Advisor } from "./pages/Advisor";

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      case "split":
        return <SplitBill />;
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-slate-900 dark:text-white flex transition-colors duration-300">
      
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickLog={() => setQuickLogOpen(true)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
        <main className="flex-1 w-full max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8 pb-28">
          {/* Top Universal Header */}
          <TopHeader
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            setActiveTab={setActiveTab}
          />

          {/* Active Sub-page Component */}
          {renderActivePage()}
        </main>
      </div>

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
    <ThemeProvider>
      <FinancialProvider>
        <GamificationProvider>
          <AppContent />
        </GamificationProvider>
      </FinancialProvider>
    </ThemeProvider>
  );
}

export default App;
