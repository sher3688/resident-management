export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Return the in-app login page instead of OAuth portal
export const getLoginUrl = () => {
  return '/login';
};
