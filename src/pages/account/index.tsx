import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AccountIndex() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to profile page
    setLocation("/account/profile");
  }, [setLocation]);

  return null;
}
