import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Button, Typography, Box, Alert } from '@mui/material'
import { BaseCard } from '@nyanpasu/ui'
import { commands } from '@nyanpasu/interface'

export default function SettingSystemService() {
  const { t } = useTranslation()
  const [installing, setInstalling] = useState(false)
  const [starting, setStarting] = useState(false)
  const [message, setMessage] = useState('')
  
  console.log('SettingSystemService render - using proper interface commands')

  const handleInstallService = async () => {
    setInstalling(true)
    setMessage('')
    try {
      // Use serviceSetup for one-click install and enable service mode
      const result = await commands.serviceSetup()
      if (result.status === 'ok') {
        setMessage('服务安装成功！')
      } else {
        setMessage(`服务安装失败: ${result.error}`)
      }
    } catch (error) {
      console.error('Service install error:', error)
      setMessage(`服务安装失败: ${error}`)
    } finally {
      setInstalling(false)
    }
  }

  const handleStartService = async () => {
    setStarting(true)
    setMessage('')
    try {
      const result = await commands.serviceStart()
      if (result.status === 'ok') {
        setMessage('服务启动成功！')
      } else {
        setMessage(`服务启动失败: ${result.error}`)
      }
    } catch (error) {
      console.error('Service start error:', error)
      setMessage(`服务启动失败: ${error}`)
    } finally {
      setStarting(false)
    }
  }

  // Always render in extreme cleanup version for testing

  return (
    <BaseCard label={t('System Service')}>
      <Box display="flex" flexDirection="column" gap={2}>
        <Typography variant="body2" color="text.secondary">
          {t('Install system service for better TUN mode support')}
        </Typography>
        
        {message && (
          <Alert severity={message.includes('Failed') ? 'error' : 'success'} sx={{ mt: 1 }}>
            {message}
          </Alert>
        )}
        
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            size="small"
            onClick={handleInstallService}
            disabled={installing || starting}
          >
            {installing ? '安装中...' : '安装服务'}
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            onClick={handleStartService}
            disabled={installing || starting}
          >
            {starting ? '启动中...' : '启动服务'}
          </Button>
        </Box>
      </Box>
    </BaseCard>
  )
}
