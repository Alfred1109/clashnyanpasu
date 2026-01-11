import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { getIpsbASN } from '@/service'

export interface IPSBResponse {
  organization: string
  longitude: number
  timezone: string
  isp: string
  offset: number
  asn: number
  asn_organization: string
  country: string
  ip: string
  latitude: number
  continent_code: string
  country_code: string
}

export const useIPSB = (config?: Partial<UseQueryOptions<IPSBResponse>>) => {
  return useQuery<IPSBResponse>({
    queryKey: ['https://api.ip.sb/geoip'],
    queryFn: () => getIpsbASN(),
    ...config,
  })
}
