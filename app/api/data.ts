import { useNavigate, useLocation } from "@remix-run/react";
import { useCallback } from "react";

export const useRefetchData = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    () => navigate(location.pathname, { replace: true }),
    [navigate, location]
  );
};
