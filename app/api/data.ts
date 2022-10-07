import { useNavigate } from "@remix-run/react";
import { useCallback } from "react";

export const useRefetchData = () => {
  const navigate = useNavigate();

  return useCallback(() => navigate(".", { replace: true }), [navigate]);
};
