import { useNavigate as rrNavigate, useLocation as rrLocation, useSearchParams as rrSearchParams, useParams as rrParams } from "react-router-dom";

export function useRouter() {
  const navigate = rrNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
  };
}

export const useNavigate = rrNavigate;
export const useLocation = rrLocation;
export const useSearchParams = () => {
  const [searchParams] = rrSearchParams();
  return searchParams;
};
export const useParams = rrParams;
export const usePathname = () => {
  const location = rrLocation();
  return location.pathname;
};
