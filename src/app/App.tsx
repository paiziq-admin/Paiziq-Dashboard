import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppThemeProvider } from "./theme";

export default function App() {
  return (
    <AppThemeProvider>
      <RouterProvider router={router} />
    </AppThemeProvider>
  );
}
