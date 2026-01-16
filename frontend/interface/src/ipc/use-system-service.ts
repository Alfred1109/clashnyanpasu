import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commands, type StatusInfo } from './bindings'

export type ServiceType = 'install' | 'uninstall' | 'start' | 'stop'

/**
 * Custom hook to fetch and manage the system service status using TanStack Query.
 *
 * @returns An object containing the query result for the system service status.
 */
export const useSystemService = () => {
  const queryClient = useQueryClient()
  const isInTauri = typeof window !== 'undefined' && '__TAURI__' in window
  const isBrowser = typeof window !== 'undefined'

  const unwrap = <T, E>(
    res: { status: 'ok'; data: T } | { status: 'error'; error: E },
  ) => {
    if (res.status === 'error') {
      throw res.error
    }
    return res.data
  }

  const query = useQuery<StatusInfo>({
    queryKey: ['system-service'],
    enabled: isInTauri || isBrowser,
    queryFn: async () => {
      if (!isInTauri) {
        try {
          const res = await fetch('/__local_api/service/status', {
            cache: 'no-store',
          })
          if (!res.ok) {
            console.warn(`Local API failed with status: ${res.status}`)
            return {
              name: '',
              version: '',
              status: 'not_installed' as const,
              server: null,
            }
          }
          const data = (await res.json()) as {
            status?: 'running' | 'stopped' | 'not_installed'
            version?: string
          }
          const status = data.status ?? 'not_installed'
          return {
            name: '',
            version: data.version ?? '',
            status: status as any,
            server: null,
          }
        } catch (error) {
          console.warn(
            'Failed to query local API, treating as not_installed:',
            error,
          )
          return {
            name: '',
            version: '',
            status: 'not_installed' as const,
            server: null,
          }
        }
      }

      try {
        const result = await commands.serviceStatus()
        if (result.status === 'error') {
          console.warn('Service status command returned error:', result.error)
          return {
            name: '',
            version: '',
            status: 'not_installed' as const,
            server: null,
          }
        }
        return result.data
      } catch (error) {
        console.warn('Service status command failed:', error)
        const message = String(error).toLowerCase()

        // 扩大匹配范围，涵盖更多服务不可用的情况
        const isNotInstalled =
          message.includes('executable not found') ||
          message.includes('not installed') ||
          message.includes('not found') ||
          message.includes('does not exist') ||
          message.includes('找不到') ||
          message.includes('不存在') ||
          message.includes('failed to execute') ||
          message.includes('no such file') ||
          message.includes('command') ||
          message.includes('invoke')

        console.debug('Service appears not installed:', message)
        return {
          name: '',
          version: '',
          status: 'not_installed' as const,
          server: null,
        }
      }
    },
    refetchInterval: 5000,
    // 禁用重试，避免重复错误日志
    retry: false,
    // 确保即使查询失败也不会进入error状态
    throwOnError: false,
  })

  const upsert = useMutation({
    mutationFn: async (type: ServiceType) => {
      switch (type) {
        case 'install':
          unwrap(await commands.serviceInstall())
          break

        case 'uninstall':
          unwrap(await commands.serviceUninstall())
          break

        case 'start':
          unwrap(await commands.serviceStart())
          break

        case 'stop':
          unwrap(await commands.serviceStop())
          break
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-service'] })
    },
  })

  return {
    query,
    upsert,
  }
}
