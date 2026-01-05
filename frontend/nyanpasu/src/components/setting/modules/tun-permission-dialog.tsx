import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material'

interface TunPermissionDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export const TunPermissionDialog = ({
  open,
  onClose,
  onConfirm,
}: TunPermissionDialogProps) => {
  const { t } = useTranslation()
  const [granting, setGranting] = useState(false)

  const handleGrantPermission = async () => {
    setGranting(true)
    // 暂时直接确认，后续会添加实际的权限授予逻辑
    setTimeout(() => {
      setGranting(false)
      onConfirm()
    }, 1000)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('TUN Mode Permission Required')}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <Typography variant="body1" gutterBottom>
            {t(
              'TUN mode requires special network permissions to function properly.',
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t(
              'This will grant the clash core the necessary capabilities (CAP_NET_ADMIN) to create and manage TUN interfaces.',
            )}
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
            {t('Administrator privileges may be required for this operation.')}
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
