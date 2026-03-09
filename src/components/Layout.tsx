import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <CommandPalette />
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
