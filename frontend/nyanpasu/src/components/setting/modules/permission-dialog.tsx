import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatError } from '@/utils'
import { message } from '@/utils/notification'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material'

export type PermissionType = 'tun' | 'service' | 'proxy' | 'autostart'

interface PermissionDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  permissionType: PermissionType
}

const getPermissionInfo = (
  type: PermissionType,
  t: (key: string) => string,
) => {
  switch (type) {
    case 'tun':
      return {
        title: t('TUN Mode Permission Required'),
        description: t(
          'TUN mode requires special network permissions to function properly.',
        ),
        details: t(
          'This will grant the clash core the necessary capabilities (CAP_NET_ADMIN) to create and manage TUN interfaces.',
        ),
        warning: t(
          'Administrator privileges may be required for this operation.',
        ),
      }
    case 'service':
      return {
        title: t('Service Mode Permission Required'),
        description: t(
          'Service mode requires access to the system service IPC socket.',
        ),
        details: t(
          'This will add your user to the nyanpasu group to access the service.',
        ),
        warning: t(
          'You may need to log out and log back in for the changes to take effect.',
        ),
      }
    case 'proxy':
      return {
        title: t('System Proxy Permission Required'),
        description: t(
          'System proxy requires permission to modify network settings.',
        ),
        details: t(
          'This may require administrator privileges to change system proxy settings.',
        ),
        warning: t(
          'On macOS, you may need to grant accessibility permissions in System Preferences.',
        ),
      }
    case 'autostart':
      return {
        title: t('Auto-start Permission Required'),
        description: t(
          'Auto-start requires permission to modify system startup items.',
        ),
        details: t(
          'This will add the application to your system startup programs.',
        ),
        warning: t(
          'This operation is usually safe and requires no special privileges.',
        ),
      }
  }
}

export const PermissionDialog = ({
  open,
  onClose,
  onConfirm,
  permissionType,
}: PermissionDialogProps) => {
  const { t } = useTranslation()
  const [granting, setGranting] = useState(false)

  const permissionInfo = getPermissionInfo(permissionType, t)

  const handleGrantPermission = async () => {
    setGranting(true)
    try {
      // 暂时直接确认，后续会添加实际的权限授予逻辑
      setTimeout(() => {
        setGranting(false)
        message(t('Permission granted successfully'), {
          title: t('Success'),
          kind: 'info',
        })
        onConfirm()
      }, 1000)
    } catch (error) {
      message(`${t('Failed to grant permission')}\n${formatError(error)}`, {
        title: t('Error'),
        kind: 'error',
      })
      setGranting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{permissionInfo.title}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <Typography variant="body1" gutterBottom>
            {permissionInfo.description}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {permissionInfo.details}
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
            {permissionInfo.warning}
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={granting}>
          {t('Cancel')}
        </Button>
        <Button
          onClick={handleGrantPermission}
          variant="contained"
          disabled={granting}
        >
          {granting ? t('Granting...') : t('Grant Permission')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
