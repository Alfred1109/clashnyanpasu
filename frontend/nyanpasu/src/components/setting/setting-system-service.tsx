import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { useServiceManager } from '@/hooks/use-service-manager'
import { formatError } from '@/utils'
import { message } from '@/utils/notification'
import { Button, List, ListItem, ListItemText, Typography } from '@mui/material'
import { startService, stopService, useSetting } from '@nyanpasu/interface'
import { BaseCard, SwitchItem } from '@nyanpasu/ui'
import { ServiceInstallDialog } from './modules/service-install-dialog'
import {
  ServerManualPromptDialogWrapper,
  useServerManualPromptDialog,
} from './modules/service-manual-prompt-dialog'

export const SettingSystemService = () => {
  const { t } = useTranslation()

  // 使用统一的服务管理 hook
  const serviceManager = useServiceManager()
  const serviceMode = useSetting('enable_service_mode')
  const promptDialog = useServerManualPromptDialog()

  const getServiceActionButtons = () => {
    const buttons = []

    // Debug log to see actual status value
    console.log(
      'Service status for buttons:',
      serviceManager.serviceStatus,
      typeof serviceManager.serviceStatus,
    )

    switch (serviceManager.serviceStatus) {
      case 'not_installed': {
        buttons.push({
          key: 'install',
          label: t('install'),
          action: 'install',
          variant: 'contained' as const,
        })
        break
      }

      case 'stopped': {
        buttons.push({
          key: 'start',
          label: t('start'),
          action: 'start',
          variant: 'contained' as const,
        })
        buttons.push({
          key: 'uninstall',
          label: t('uninstall'),
          action: 'uninstall',
          variant: 'outlined' as const,
        })
        break
      }

      case 'running': {
        buttons.push({
          key: 'stop',
          label: t('stop'),
          action: 'stop',
          variant: 'contained' as const,
        })
        break
      }

      default: {
        console.log('Unknown service status, adding debug install button')
        // 添加一个调试按钮，以防状态值不匹配
        buttons.push({
          key: 'install',
          label: t('install'),
          action: 'install',
          variant: 'contained' as const,
        })
        break
      }
    }

    return buttons
  }

  const handleServiceAction = useMemoizedFn(async (action: string) => {
    try {
      switch (action) {
        case 'install':
          await serviceManager.installService()
          message(t('Service installed successfully'), {
            kind: 'info',
            title: t('Success'),
          })
          break

        case 'uninstall':
          await serviceManager.uninstallService()
          message(t('Service uninstalled successfully'), {
            kind: 'info',
            title: t('Success'),
          })
          break

        case 'start':
          await startService()
          await serviceManager.query.refetch()
          message(t('Service started successfully'), {
            kind: 'info',
            title: t('Success'),
          })
          break

        case 'stop':
          await stopService()
          await serviceManager.query.refetch()
          message(t('Service stopped successfully'), {
            kind: 'info',
            title: t('Success'),
          })
          break

        default:
          break
      }
    } catch (e) {
      const actionName =
        {
          install: t('Failed to install'),
          uninstall: t('Failed to uninstall'),
          start: t('Failed to start'),
          stop: t('Failed to stop'),
        }[action] || t('Operation failed')

      const errorMessage = `${actionName}: ${formatError(e)}`

      message(errorMessage, {
        kind: 'error',
        title: t('Error'),
      })

      // 如果操作失败，提示用户手动操作
      if (action === 'install' || action === 'uninstall') {
        promptDialog.show(action as 'install' | 'uninstall')
      }
    }
  })

  const handleServiceModeToggle = useMemoizedFn(() => {
    // 检查服务状态
    if (serviceManager.serviceStatus !== 'running') {
      const statusMessage =
        serviceManager.serviceStatus === 'not_installed'
          ? t('Service not installed, please install the system service first')
          : t('Service not running, please start the system service first')

      message(statusMessage, {
        title: t('Service Mode'),
        kind: 'warning',
      })
      return
    }

    serviceMode.upsert(!serviceMode.value)
  })

  return (
    <BaseCard label={t('System Service')}>
      <ServerManualPromptDialogWrapper />

      {/* 统一的服务安装进度 Dialog */}
      <ServiceInstallDialog
        open={serviceManager.isInstalling}
        installStage={serviceManager.installStage}
        canCancel={serviceManager.canCancel}
        handleCancel={serviceManager.cancelInstallation}
      />

      <List disablePadding>
        <SwitchItem
          label={t('Service Mode')}
          disabled={false}
          checked={serviceMode.value || false}
          onChange={handleServiceModeToggle}
        />

        {serviceManager.serviceStatus !== 'running' && (
          <ListItem sx={{ pl: 0, pr: 0 }}>
            <Typography>
              {serviceManager.serviceStatus === 'not_installed'
                ? t(
                    'Service not installed, please install the system service first to enable service mode',
                  )
                : t(
                    'Service not running, please start the system service first to enable service mode',
                  )}
            </Typography>
          </ListItem>
        )}

        <ListItem sx={{ pl: 0, pr: 0 }}>
          <ListItemText
            primary={t('Current Status', {
              status: t(`${serviceManager.serviceStatus}`),
            })}
          />
          <div className="flex gap-2">
            {getServiceActionButtons().map((button) => (
              <Button
                key={button.key}
                variant={button.variant}
                onClick={() => handleServiceAction(button.action)}
                disabled={serviceManager.isInstalling}
              >
                {button.label}
              </Button>
            ))}

            {import.meta.env.DEV && (
              <Button
                variant="contained"
                onClick={() => promptDialog.show('install')}
              >
                {t('Prompt')}
              </Button>
            )}
          </div>
        </ListItem>
      </List>
    </BaseCard>
  )
}

export default SettingSystemService
