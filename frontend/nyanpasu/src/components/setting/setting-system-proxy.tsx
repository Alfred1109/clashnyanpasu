import { useLockFn } from 'ahooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatError } from '@/utils'
import { message } from '@/utils/notification'
import {
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  List,
  ListItem,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  restartSidecar,
  toggleSystemProxy,
  toggleTunMode,
  useSetting,
  useSystemProxy,
  useSystemService,
} from '@nyanpasu/interface'
import {
  BaseCard,
  Expand,
  ExpandMore,
  NumberItem,
  SwitchItem,
  TextItem,
} from '@nyanpasu/ui'
import { PaperSwitchButton } from './modules/system-proxy'
import {
  ServerManualPromptDialogWrapper,
  useServerManualPromptDialog,
} from './modules/service-manual-prompt-dialog'

const withTimeout = async <T,>(promise: Promise<T>, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('timeout'))
    }, ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

type ModeAction = 'system_proxy' | 'tun'

const TunModeButton = ({
  serviceStatus,
  onRequireInstall,
  disabled,
}: {
  serviceStatus?: string
  onRequireInstall: (action: ModeAction) => void
  disabled?: boolean
}) => {
  const { t } = useTranslation()

  const tunMode = useSetting('enable_tun_mode')

  const handleTunMode = useLockFn(async () => {
    if (!tunMode.value && serviceStatus === 'not_installed') {
      onRequireInstall('tun')
      return
    }

    try {
      await toggleTunMode()
    } catch (error) {
      message(`Activation TUN Mode failed! \n Error: ${formatError(error)}`, {
        title: t('Error'),
        kind: 'error',
      })
    }
  })

  return (
    <PaperSwitchButton
      label={t('TUN Mode')}
      checked={Boolean(tunMode.value)}
      onClick={handleTunMode}
      disabled={disabled}
    />
  )
}

const SystemProxyButton = ({
  serviceStatus,
  onRequireInstall,
  disabled,
}: {
  serviceStatus?: string
  onRequireInstall: (action: ModeAction) => void
  disabled?: boolean
}) => {
  const { t } = useTranslation()

  const systemProxy = useSetting('enable_system_proxy')

  const handleSystemProxy = useLockFn(async () => {
    if (!systemProxy.value && serviceStatus === 'not_installed') {
      onRequireInstall('system_proxy')
      return
    }
    try {
      await toggleSystemProxy()
    } catch (error) {
      message(`Activation System Proxy failed!`, {
        title: t('Error'),
        kind: 'error',
      })
    }
  })

  return (
    <PaperSwitchButton
      label={t('System Proxy')}
      checked={Boolean(systemProxy.value)}
      onClick={handleSystemProxy}
      disabled={disabled}
    />
  )
}

const ProxyGuardSwitch = () => {
  const { t } = useTranslation()

  const proxyGuard = useSetting('enable_proxy_guard')

  const handleProxyGuard = useLockFn(async () => {
    try {
      await proxyGuard.upsert(!proxyGuard.value)
    } catch (error) {
      message(`Activation Proxy Guard failed!`, {
        title: t('Error'),
        kind: 'error',
      })
    }
  })

  return (
    <SwitchItem
      label={t('Proxy Guard')}
      checked={Boolean(proxyGuard.value)}
      onClick={handleProxyGuard}
    />
  )
}

const ProxyGuardInterval = () => {
  const { t } = useTranslation()

  const proxyGuardInterval = useSetting('proxy_guard_interval')

  return (
    <NumberItem
      label={t('Guard Interval')}
      value={proxyGuardInterval.value || 0}
      checkEvent={(input) => input <= 0}
      checkLabel={t('The interval must be greater than 0 second')}
      onApply={(value) => {
        proxyGuardInterval.upsert(value)
      }}
      textFieldProps={{
        inputProps: {
          'aria-autocomplete': 'none',
        },
        InputProps: {
          endAdornment: (
            <InputAdornment position="end">{t('seconds')}</InputAdornment>
          ),
        },
      }}
    />
  )
}

const DEFAULT_BYPASS =
  'localhost;127.;192.168.;10.;172.16.;172.17.;172.18.;172.19.;172.20.;172.21.;172.22.;172.23.;172.24.;172.25.;172.26.;172.27.;172.28.;172.29.;172.30.;172.31.*'

const SystemProxyBypass = () => {
  const { t } = useTranslation()

  const systemProxyBypass = useSetting('system_proxy_bypass')

  return (
    <TextItem
      label={t('Proxy Bypass')}
      value={systemProxyBypass.data || ''}
      onApply={(value) => {
        if (!value || value.trim() === '') {
          // 输入为空 → 重置为默认规则
          systemProxyBypass.upsert(DEFAULT_BYPASS)
        } else {
          // 正常写入用户配置
          systemProxyBypass.upsert(value)
        }
      }}
    />
  )
}

const CurrentSystemProxy = () => {
  const { t } = useTranslation()

  const { data } = useSystemProxy()

  return (
    <ListItem
      className="w-full! flex-col! items-start! select-text"
      sx={{ pl: 0, pr: 0 }}
    >
      <div className="text-base leading-10">{t('Current System Proxy')}</div>

      {Object.entries(data ?? []).map(([key, value], index) => {
        return (
          <div key={index} className="flex w-full leading-8">
            <div className="w-28 capitalize">{key}:</div>

            <div className="text-warp flex-1 break-all">{String(value)}</div>
          </div>
        )
      })}
    </ListItem>
  )
}

export const SettingSystemProxy = () => {
  const { t } = useTranslation()

  const [expand, setExpand] = useState(false)

  const { query, upsert: serviceUpsert } = useSystemService()
  const systemProxy = useSetting('enable_system_proxy')
  const tunMode = useSetting('enable_tun_mode')
  const promptDialog = useServerManualPromptDialog()
  const isServiceInstalled = query.data?.status !== 'not_installed'
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [showUninstallDialog, setShowUninstallDialog] = useState(false)
  const [serviceActionPending, setServiceActionPending] = useState(false)
  const [serviceActionText, setServiceActionText] = useState<string>('')
  const [pendingModeAction, setPendingModeAction] = useState<ModeAction | null>(
    null,
  )

  const getStatusColor = () => {
    switch (query.data?.status) {
      case 'running':
        return 'success.main'
      case 'stopped':
        return 'warning.main'
      case 'not_installed':
        return 'error.main'
      default:
        return 'text.secondary'
    }
  }

  const getStatusText = () => {
    if (!isServiceInstalled) {
      return t('Not Installed')
    }
    switch (query.data?.status) {
      case 'running':
        return t('running')
      case 'stopped':
        return t('stopped')
      default:
        return t(query.data?.status || 'unknown')
    }
  }

  const handleRequireInstall = (action: ModeAction) => {
    setPendingModeAction(action)
    setShowInstallDialog(true)
  }

  const handleInstallConfirm = useLockFn(async () => {
    setShowInstallDialog(false)
    try {
      setServiceActionPending(true)
      setServiceActionText(t('install'))
      await withTimeout(serviceUpsert.mutateAsync('install'), 60_000)
      await restartSidecar()

      for (let i = 0; i < 10; i++) {
        const result = await query.refetch()
        if (result.data?.status !== 'not_installed') {
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      if (pendingModeAction) {
        setServiceActionText(t('start'))
        await withTimeout(serviceUpsert.mutateAsync('start'), 30_000)
        await restartSidecar()

        if (pendingModeAction === 'system_proxy') {
          setServiceActionText(t('System Proxy'))
          await withTimeout(toggleSystemProxy(), 30_000)
        }
        if (pendingModeAction === 'tun') {
          setServiceActionText(t('TUN Mode'))
          await withTimeout(toggleTunMode(), 30_000)
        }
      }

      await query.refetch()
    } catch (error) {
      if (error instanceof Error && error.message === 'timeout') {
        message(t('Operation timed out, it may be waiting for UAC/permission prompt'), {
          title: t('Error'),
          kind: 'error',
        })
        promptDialog.show('install')
      } else {
      message(
        `${t('Failed to install system service')}\n${formatError(error)}`,
        {
          title: t('Error'),
          kind: 'error',
        },
      )
      promptDialog.show('install')
      }
    } finally {
      setPendingModeAction(null)
      setServiceActionPending(false)
      setServiceActionText('')
    }
  })

  const handleUninstallConfirm = useLockFn(async () => {
    setShowUninstallDialog(false)
    try {
      setServiceActionPending(true)
      setServiceActionText(t('uninstall'))

      if (systemProxy.value) {
        await toggleSystemProxy()
      }
      if (tunMode.value) {
        await toggleTunMode()
      }

      await withTimeout(serviceUpsert.mutateAsync('uninstall'), 60_000)
      await restartSidecar()
      await query.refetch()
    } catch (error) {
      if (error instanceof Error && error.message === 'timeout') {
        message(t('Operation timed out, it may be waiting for UAC/permission prompt'), {
          title: t('Error'),
          kind: 'error',
        })
        promptDialog.show('uninstall')
      } else {
      message(`${t('Error')}: ${formatError(error)}`, {
        title: t('Error'),
        kind: 'error',
      })
      promptDialog.show('uninstall')
      }
    } finally {
      setServiceActionPending(false)
      setServiceActionText('')
    }
  })

  return (
    <BaseCard
      label={t('System Settings')}
      labelChildren={
        <ExpandMore expand={expand} onClick={() => setExpand(!expand)} />
      }
    >
      <ServerManualPromptDialogWrapper />
      <Backdrop
        open={serviceActionPending}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <div className="flex flex-col items-center gap-3">
          <CircularProgress color="inherit" />
          <Typography variant="body2">
            {serviceActionText || t('Processing')}
          </Typography>
        </div>
      </Backdrop>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <SystemProxyButton
            serviceStatus={query.data?.status}
            onRequireInstall={handleRequireInstall}
            disabled={serviceActionPending || query.isLoading}
          />
        </Grid>

        <Grid size={{ xs: 6 }}>
          <TunModeButton
            serviceStatus={query.data?.status}
            onRequireInstall={handleRequireInstall}
            disabled={serviceActionPending || query.isLoading}
          />
        </Grid>
      </Grid>

      {/* 服务模式部分 */}
      <List disablePadding sx={{ pt: 1 }}>
        <ListItem sx={{ pl: 0, pr: 0 }}>
          <div className="text-base leading-10">{t('Status')}</div>
          <div className="ml-auto">
            <span
              style={{ color: getStatusColor() }}
              className="text-sm font-medium"
            >
              {getStatusText()}
            </span>
          </div>
        </ListItem>

        {!isServiceInstalled && (
          <ListItem sx={{ pl: 0, pr: 0 }}>
            <div className="text-sm text-gray-500">
              {t(
                'Install system service to enable service mode and avoid permission issues',
              )}
            </div>
          </ListItem>
        )}

        {query.data?.status === 'not_installed' && (
          <ListItem sx={{ pl: 0, pr: 0 }}>
            <div className="ml-auto">
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setPendingModeAction(null)
                  setShowInstallDialog(true)
                }}
                disabled={serviceActionPending || query.isLoading}
              >
                {t('install')}
              </Button>
            </div>
          </ListItem>
        )}

        {query.data?.status === 'stopped' && (
          <ListItem sx={{ pl: 0, pr: 0 }}>
            <div className="ml-auto">
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => setShowUninstallDialog(true)}
                disabled={serviceActionPending || query.isLoading}
              >
                {t('uninstall')}
              </Button>
            </div>
          </ListItem>
        )}
      </List>

      <Dialog
        open={showInstallDialog}
        onClose={() => setShowInstallDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('Install system service')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(
              'The system service is not installed. Do you want to install it now to enable service mode?',
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstallDialog(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleInstallConfirm}
            variant="contained"
            disabled={serviceActionPending || query.isLoading}
          >
            {t('Install')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showUninstallDialog}
        onClose={() => setShowUninstallDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('uninstall')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(
              'Are you sure you want to uninstall the system service? This will disable service mode.',
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUninstallDialog(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleUninstallConfirm}
            variant="contained"
            color="error"
            disabled={serviceActionPending || query.isLoading}
          >
            {t('uninstall')}
          </Button>
        </DialogActions>
      </Dialog>

      <Expand open={expand}>
        <List disablePadding sx={{ pt: 1 }}>
          <ProxyGuardSwitch />

          <ProxyGuardInterval />

          <SystemProxyBypass />

          <CurrentSystemProxy />
        </List>
      </Expand>
    </BaseCard>
  )
}

export default SettingSystemProxy
