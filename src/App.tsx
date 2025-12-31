import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/language-context";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
import { RestaurantProvider } from "@/lib/restaurant-context";
import { FontLoader } from "@/components/font-loader";
import { ThemeInjector } from "@/components/theme-injector";
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Branches from "@/pages/branches";
import Locations from "@/pages/locations";
import Lounas from "@/pages/lounas";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import OrderSuccess from "@/pages/order-success";
import NotFound from "@/pages/not-found";
import HelmiesLanding from "@/pages/helmies-landing";
// Auth pages
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
// Account pages
import Profile from "@/pages/account/profile";
import Loyalty from "@/pages/account/loyalty";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/helmies" component={HelmiesLanding} />
      <Route path="/menu" component={Menu} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/branches" component={Branches} />
      <Route path="/locations" component={Locations} />
      <Route path="/lounas" component={Lounas} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/order-success" component={OrderSuccess} />
      {/* Auth routes */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      {/* Account routes */}
      <Route path="/account/profile" component={Profile} />
      <Route path="/account/loyalty" component={Loyalty} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RestaurantProvider>
        <FontLoader />
        <ThemeInjector />
        <ThemeProvider>
          <LanguageProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </CartProvider>
          </LanguageProvider>
        </ThemeProvider>
      </RestaurantProvider>
    </QueryClientProvider>
  );
}

export default App;
