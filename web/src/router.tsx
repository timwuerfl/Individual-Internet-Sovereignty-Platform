import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Inventory from "./pages/Inventory";
import Leaks from "./pages/Leaks";
import Reputation from "./pages/Reputation";
import Legacy from "./pages/Legacy";
import Settings from "./pages/Settings";
import DataRights from "./pages/DataRights";
import Monitoring from "./pages/Monitoring";
import Agents from "./pages/Agents";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "profile", element: <Profile /> },
      { path: "inventory", element: <Inventory /> },
      { path: "leaks", element: <Leaks /> },
      { path: "reputation", element: <Reputation /> },
      { path: "legacy", element: <Legacy /> },
      { path: "data-rights", element: <DataRights /> },
      { path: "monitoring", element: <Monitoring /> },
      { path: "agents", element: <Agents /> },
      { path: "settings", element: <Settings /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
