import { useLockFn } from 'ahooks'
import { useAtomValue } from 'jotai'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { atomIsDrawer } from '@/store'
import { formatError } from '@/utils'
import { message } from '@/utils/notification'
import { NetworkPing, SettingsEthernet } from '@mui/icons-material'
import { Chip, Paper, type ChipProps } from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  toggleSystemProxy,
  toggleTunMode,
  useClashConfig,
  useSetting,
  useSystemProxy,
} from '@nyanpasu/interface'
import { PaperSwitchButton } from '../setting/modules/system-proxy'
import { TunPermissionDialog } from '../setting/modules/tun-permission-dialog'
import {
  PermissionDialog,
  type PermissionType,
} from '../setting/modules/permission-dialog'

const TitleComp = () => {
  const { t } = useTranslation()

  const { data } = useSystemProxy()

  const {
    query: { data: clashConfigs },
  } = useClashConfig()

  const status = useMemo<{
    label: string
    color: ChipProps['color']
  }>(() => {
    if (data?.enable) {
      const port = Number(data.server.split(':')[1])

      if (port === clashConfigs?.['mixed-port']) {
        return {
          label: t('Successful'),
          color: 'success',
        }
      } else {
        return {
          label: t('Occupied'),
          color: 'warning',
        }
      }
    } else {
      return {
        label: t('Disabled'),
        color: 'error',
      }
    }
  }, [clashConfigs, data?.enable, data?.server, t])

  return (
    <div className="flex items-center gap-2 px-1">
      <div>{t('Proxy Takeover Status')}</div>

      <Chip
        color={status.color}
        className="!h-5"
        sx={{
          span: {
            padding: '0 8px',
          },
        }}
        label={status.label}
      />
    </div>
  )
}

export const ProxyShortcuts = () => {
  const { t } = useTranslation()

  const isDrawer = useAtomValue(atomIsDrawer)
  const [showTunPermissionDialog, setShowTunPermissionDialog] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [permissionType, setPermissionType] = useState<PermissionType>('proxy')

  const systemProxy = useSetting('enable_system_proxy')

  const handleSystemProxy = useLockFn(async () => {
    // 如果要启用系统代理，先检查权限
    if (!systemProxy.value) {
      setPermissionType('proxy')
      setShowPermissionDialog(true)
      return
    }

    // 关闭系统代理直接执行
    try {
      await toggleSystemProxy()
    } catch (error) {
      message(`Activation System Proxy failed!`, {
        title: t('Error'),
        kind: 'error',
      })
    }
  })

  const tunMode = useSetting('enable_tun_mode')

  const handleTunMode = useLockFn(async () => {
    // 如果要启用TUN模式，先显示权限确认对话框
    if (!tunMode.value) {
      setShowTunPermissionDialog(true)
      return
    }

    // 关闭TUN模式直接执行
    try {
      await toggleTunMode()
    } catch (error) {
      message(`Activation TUN Mode failed! \n Error: ${formatError(error)}`, {
        title: t('Error'),
        kind: 'error',
      })
    }
  })

  const handleTunPermissionConfirm = useLockFn(async () => {
    setShowTunPermissionDialog(false)
    try {
      await toggleTunMode()
    } catch (error) {
      message(`Activation TUN Mode failed! \n Error: ${formatError(error)}`, {
        title: t('Error'),
        kind: 'error',
      })
    }
  })

  const handlePermissionConfirm = useLockFn(async () => {
    setShowPermissionDialog(false)
    try {
      if (permissionType === 'proxy') {
        await toggleSystemProxy()
      }
      // 可以扩展支持其他权限类型
    } catch (error) {
      message(`Activation failed! \n Error: ${formatError(error)}`, {
        title: t('Error'),
        kind: 'error',
      })
    }
  })

  return (
    <Grid
      size={{
        sm: isDrawer ? 6 : 12,
        md: 6,
        lg: 4,
        xl: 3,
      }}
    >
      <Paper className="flex !h-full flex-col justify-between gap-2 !rounded-3xl p-3">
        <TitleComp />

        <div className="flex gap-3">
          <div className="!w-full">
            <PaperSwitchButton
              checked={systemProxy.value || false}
              onClick={handleSystemProxy}
            >
              <div className="flex flex-col gap-2">
                <NetworkPing />

                <div>{t('System Proxy')}</div>
              </div>
            </PaperSwitchButton>
          </div>

          <div className="!w-full">
            <PaperSwitchButton
              checked={tunMode.value || false}
              onClick={handleTunMode}
            >
              <div className="flex flex-col gap-2">
                <SettingsEthernet />

                <div>{t('TUN Mode')}</div>
              </div>
            </PaperSwitchButton>
          </div>
        </div>
      </Paper>

      <TunPermissionDialog
        open={showTunPermissionDialog}
        onClose={() => setShowTunPermissionDialog(false)}
        onConfirm={handleTunPermissionConfirm}
      />

      <PermissionDialog
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        onConfirm={handlePermissionConfirm}
        permissionType={permissionType}
      />
    </Grid>
  )
}

export default ProxyShortcuts
