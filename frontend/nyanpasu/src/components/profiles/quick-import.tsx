import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatError } from '@/utils'
import { message } from '@/utils/notification'
import { ClearRounded, ContentCopyRounded, Download } from '@mui/icons-material'
import {
  CircularProgress,
  FilledInputProps,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material'
import { useProfile } from '@nyanpasu/interface'
import { alpha } from '@nyanpasu/ui'
import { readText } from '@tauri-apps/plugin-clipboard-manager'

export const QuickImport = () => {
  const { t } = useTranslation()

  const [url, setUrl] = useState('')

  const [loading, setLoading] = useState(false)

  const { create } = useProfile()

  const onCopyLink = async () => {
    const text = await readText()

    if (text) {
      setUrl(text.trim())
    }
  }

  const endAdornment = () => {
    if (loading) {
      return <CircularProgress size={20} />
    }

    if (url) {
      return (
        <>
          <Tooltip title={t('Clear')}>
            <IconButton size="small" onClick={() => setUrl('')}>
              <ClearRounded fontSize="inherit" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('Download')}>
            <IconButton size="small" onClick={handleImport}>
              <Download fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </>
      )
    }

    return (
      <Tooltip title={t('Paste')}>
        <IconButton size="small" onClick={onCopyLink}>
          <ContentCopyRounded fontSize="inherit" />
        </IconButton>
      </Tooltip>
    )
  }

  const handleImport = async () => {
    const normalizedUrl = url.trim()
    if (!normalizedUrl) return

    try {
      setLoading(true)

      await create.mutateAsync({
        type: 'url',
        data: {
          url: normalizedUrl,
          option: {
            user_agent: null,
            with_proxy: null,
            self_proxy: null,
            update_interval: null,
          },
        },
      })

      setUrl('')
    } catch (error) {
      message(`${t('Error')}: ${formatError(error)}`, {
        title: t('Error'),
        kind: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const inputProps: Partial<FilledInputProps> = {
    sx: (theme) => ({
      borderRadius: 7,
      backgroundColor: alpha(theme.vars.palette.primary.main, 0.1),

      fieldset: {
        border: 'none',
      },
    }),
    endAdornment: endAdornment(),
  }

  return (
    <TextField
      hiddenLabel
      fullWidth
      autoComplete="off"
      spellCheck="false"
      value={url}
      placeholder={t('Profile URL')}
      onChange={(e) => setUrl(e.target.value)}
      onKeyDown={(e) =>
        url.trim() !== '' && e.key === 'Enter' && handleImport()
      }
      sx={{ input: { py: 1, px: 2 } }}
      slotProps={{
        input: inputProps,
      }}
    />
  )
}
