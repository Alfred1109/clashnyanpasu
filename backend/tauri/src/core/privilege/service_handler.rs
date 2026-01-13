use anyhow::Result;
use nyanpasu_ipc::types::ServiceStatus;
use tracing::{error, info, warn};

use super::{PrivilegedOperation, PrivilegedOperationHandler};
use crate::core::service::{control, ipc};

/// 服务模式权限处理器
pub struct ServicePrivilegeHandler {
    // 可以添加配置和状态管理
}

impl ServicePrivilegeHandler {
    pub fn new() -> Self {
        Self {}
    }

    /// 通过IPC发送权限操作到服务
    async fn send_privileged_command(&self, operation: &PrivilegedOperation) -> Result<()> {
        // 这里需要扩展nyanpasu-ipc来支持权限操作
        // 现在先使用现有的服务控制功能作为基础

        match operation {
            PrivilegedOperation::SetSystemProxy {
                enable,
                port,
                bypass,
            } => {
                self.set_system_proxy_via_service(*enable, *port, bypass.clone())
                    .await
            }
            PrivilegedOperation::SetTunMode { enable } => {
                self.set_tun_mode_via_service(*enable).await
            }
            PrivilegedOperation::ResetSystemProxy => self.reset_system_proxy_via_service().await,
            PrivilegedOperation::UpdateCorePermissions { core_path } => {
                self.update_core_permissions_via_service(core_path.clone())
                    .await
            }
            PrivilegedOperation::ModifyNetworkSettings { dns } => {
                self.modify_network_settings_via_service(dns.clone()).await
            }
        }
    }

    async fn set_system_proxy_via_service(
        &self,
        enable: bool,
        port: u16,
        bypass: Vec<String>,
    ) -> Result<()> {
        info!("通过服务设置系统代理: enable={}, port={}", enable, port);

        // 目前的实现：通过服务重启核心来应用代理设置
        // 未来可以扩展IPC协议来直接处理代理设置

        // 1. 更新配置（这会触发服务端的配置重新加载）
        let patch = crate::config::nyanpasu::IVerge {
            enable_system_proxy: Some(enable),
            enable_tun_mode: if enable { Some(false) } else { None },
            verge_mixed_port: Some(port),
            system_proxy_bypass: if bypass.is_empty() {
                None
            } else {
                Some(bypass.join(","))
            },
            ..Default::default()
        };

        crate::feat::patch_verge(patch).await?;

        // 2. 通知服务重新配置代理
        // 这里可以发送特定的IPC消息，现在使用核心重启
        self.request_core_restart().await?;

        Ok(())
    }

    async fn set_tun_mode_via_service(&self, enable: bool) -> Result<()> {
        info!("通过服务设置TUN模式: enable={}", enable);

        // 1. 更新配置
        let patch = crate::config::nyanpasu::IVerge {
            enable_tun_mode: Some(enable),
            enable_system_proxy: if enable { Some(false) } else { None }, // 互斥
            ..Default::default()
        };

        crate::feat::patch_verge(patch).await?;

        // 2. 通过服务重启核心（TUN模式需要特权）
        self.request_core_restart().await?;

        Ok(())
    }

    async fn reset_system_proxy_via_service(&self) -> Result<()> {
        info!("通过服务重置系统代理");

        let patch = crate::config::nyanpasu::IVerge {
            enable_system_proxy: Some(false),
            ..Default::default()
        };

        crate::feat::patch_verge(patch).await?;
        self.request_core_restart().await?;

        Ok(())
    }

    async fn update_core_permissions_via_service(
        &self,
        _core_path: std::path::PathBuf,
    ) -> Result<()> {
        info!("通过服务更新核心权限");

        // 服务模式下，核心由服务管理，权限由服务处理
        // 这里可以发送重新安装或更新核心权限的请求

        // 暂时使用重启服务来重新设置权限
        control::restart_service().await?;

        Ok(())
    }

    async fn modify_network_settings_via_service(&self, _dns: Option<Vec<String>>) -> Result<()> {
        info!("通过服务修改网络设置");

        // 未来可以实现DNS设置等网络相关操作
        // 现在先返回成功

        Ok(())
    }

    /// 请求服务重启核心
    async fn request_core_restart(&self) -> Result<()> {
        // 检查服务是否正在运行
        match control::status().await {
            Ok(status) => {
                if matches!(status.status, ServiceStatus::Running) {
                    // 服务正在运行，配置更改会自动触发核心重启
                    info!("服务正在运行，配置更改将自动应用");
                    Ok(())
                } else {
                    warn!("服务未运行，尝试启动服务");
                    control::start_service().await
                }
            }
            Err(e) => {
                error!("无法获取服务状态: {}", e);
                Err(e)
            }
        }
    }

    /// 检查服务是否支持特定操作
    fn supports_operation(&self, operation: &PrivilegedOperation) -> bool {
        match operation {
            PrivilegedOperation::SetSystemProxy { .. }
            | PrivilegedOperation::SetTunMode { .. }
            | PrivilegedOperation::ResetSystemProxy => true,
            PrivilegedOperation::UpdateCorePermissions { .. }
            | PrivilegedOperation::ModifyNetworkSettings { .. } => {
                // 这些操作需要更多的服务端支持
                false // 暂时禁用高级服务操作
            }
        }
    }
}

#[async_trait::async_trait]
impl PrivilegedOperationHandler for ServicePrivilegeHandler {
    async fn execute(&self, operation: PrivilegedOperation) -> Result<()> {
        if !self.supports_operation(&operation) {
            anyhow::bail!("服务不支持此操作: {:?}", operation);
        }

        self.send_privileged_command(&operation).await
    }

    async fn is_available(&self) -> bool {
        // 检查IPC连接状态
        let ipc_state = ipc::get_ipc_state();
        if !ipc_state.is_connected() {
            return false;
        }

        // 检查服务状态
        match control::status().await {
            Ok(status) => matches!(status.status, ServiceStatus::Running),
            Err(_) => false,
        }
    }

    fn name(&self) -> &'static str {
        "service"
    }

    fn requires_confirmation(&self, operation: &PrivilegedOperation) -> bool {
        // 服务模式下，大部分常见操作不需要用户确认
        match operation {
            PrivilegedOperation::SetSystemProxy { .. }
            | PrivilegedOperation::SetTunMode { .. }
            | PrivilegedOperation::ResetSystemProxy => false,
            _ => true, // 高级操作仍需确认
        }
    }
}
