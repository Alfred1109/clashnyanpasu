import { useLockFn } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { IS_IN_TAURI } from '@/utils/tauri'
import { message } from '@tauri-apps/plugin-dialog'
import { toggleTunMode, useSetting } from '@nyanpasu/interface'
import { BaseCard } from '@nyanpasu/ui'
import { PaperSwitchButton } from './modules/system-proxy'

const TunModeButton = ({
  serviceStatus,
  disabled,
}: {
  serviceStatus?: string
  disabled?: boolean
}) => {
  const { t } = useTranslation()

  const tunMode = useSetting('enable_tun_mode')

  const handleTunMode = useLockFn(async () => {
    // 检查服务状态
    if (serviceStatus !== 'running') {
      const statusMessage =
        serviceStatus === 'not_installed'
          ? t('Service not installed, please install the system service first')
          : t('Service not running, please start the system service first')

      message(statusMessage, {
        title: t('TUN Mode'),
        kind: 'warning',
      })
      return
    }

    try {
      await toggleTunMode()
    } catch (error) {
      message(`Activation TUN Mode failed!`, {
        title: t('Error'),
        kind: 'error',
      })
    }
  })

  const isDisabled = disabled

  return (
    <PaperSwitchButton
      label={t('TUN Mode')}
      checked={Boolean(tunMode.value)}
      onClick={handleTunMode}
      disabled={isDisabled}
    />
  )
}

export default function SettingSystemProxy() {
  const { t } = useTranslation()
  const isInTauri = IS_IN_TAURI

  return (
    <BaseCard label={t('TUN Mode')}>
      <TunModeButton
        serviceStatus="running"
        disabled={!isInTauri}
      />
    </BaseCard>
  )
}
