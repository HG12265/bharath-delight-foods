import {
  useNavigate,
  useLocation,
  useParams as params,
} from "react-router-dom";
export const useParams = params;
export const usePathname = () => useLocation().pathname;
export const useSearchParams = () => new URLSearchParams(useLocation().search);
export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (path: string, options?: { scroll?: boolean }) => navigate(path),
    replace: (path: string, options?: { scroll?: boolean }) =>
      navigate(path, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
}
export function notFound(): never {
  throw new Error("PAGE_NOT_FOUND");
}
export function redirect(path: string): never {
  window.location.replace(path);
  throw new Error("Redirecting");
}
