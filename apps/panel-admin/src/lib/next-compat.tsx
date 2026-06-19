import { useNavigate, useLocation, useParams, useSearchParams, Link as RouterLink } from "react-router-dom"
import React from "react"

export function useRouter() {
  const navigate = useNavigate()
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    prefetch: () => {},
  }
}

export function usePathname() {
  const location = useLocation()
  return location.pathname
}

export function useParamsCompat() {
  return useParams()
}

export function useSearchParamsCompat() {
  const [searchParams] = useSearchParams()
  return searchParams
}

export const Link = React.forwardRef<HTMLAnchorElement, any>(({ href, children, ...props }, ref) => {
  return (
    <RouterLink to={href} ref={ref} {...props}>
      {children}
    </RouterLink>
  )
})
