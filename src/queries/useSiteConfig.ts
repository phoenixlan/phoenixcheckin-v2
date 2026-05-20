import { useQuery } from '@tanstack/react-query'
import * as Phoenix from '@phoenixlan/phoenix.js'

export const siteConfigQueryKey = 'getSiteConfig'

export function useSiteConfig() {
    return useQuery({
        queryKey: [siteConfigQueryKey],
        queryFn: () => Phoenix.getSiteConfig(),
        staleTime: 5 * 60 * 1000,
    })
}
