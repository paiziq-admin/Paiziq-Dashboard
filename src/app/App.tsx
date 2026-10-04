import { RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import { router } from "./routes";
import { DashboardProviders } from "./context/DashboardContext";

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      storageKey="paiziq.dashboard.theme"
    >
      <DashboardProviders>
        <RouterProvider router={router} />
      </DashboardProviders>
    </ThemeProvider>
  );
}
