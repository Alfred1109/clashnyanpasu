use anyhow::Result;
use tracing::{info, warn};

use crate::config::Config;
use super::{PrivilegedOperation, manager::PrivilegeManager};

/// 权限操作的便捷函数集合
/// 这些函数提供了简化的API，隐藏了底层的权限管理复杂性

/// 设置系统代理
pub async fn set_system_proxy(enable: bool) -> Result<()> {
    let port = Config::verge()
        .latest()
        .verge_mixed_port
        .unwrap_or(Config::clash().data().get_mixed_port());
    
    let bypass = Config::verge()
        .latest()
        .system_proxy_bypass
        .clone()
        .unwrap_or_default()
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    let operation = PrivilegedOperation::SetSystemProxy {
        enable,
        port,
        bypass,
    };

    let result = PrivilegeManager::global()
        .execute_operation(operation)
        .await?;

    if !result.success {
        anyhow::bail!(
            "设置系统代理失败: {}",
            result.message.unwrap_or_else(|| "未知错误".to_string())
        );
    }

    info!("系统代理设置成功 (处理器: {})", result.handler_used);
    Ok(())
}

/// 设置TUN模式
pub async fn set_tun_mode(enable: bool) -> Result<()> {
    let operation = PrivilegedOperation::SetTunMode { enable };

    let result = PrivilegeManager::global()
        .execute_operation(operation)
        .await?;

    if !result.success {
        anyhow::bail!(
            "设置TUN模式失败: {}",
            result.message.unwrap_or_else(|| "未知错误".to_string())
        );
    }

    info!("TUN模式设置成功 (处理器: {})", result.handler_used);
    Ok(())
}

/// 重置系统代理
pub async fn reset_system_proxy() -> Result<()> {
    let operation = PrivilegedOperation::ResetSystemProxy;

    let result = PrivilegeManager::global()
        .execute_operation(operation)
        .await?;

    if !result.success {
        anyhow::bail!(
            "重置系统代理失败: {}",
            result.message.unwrap_or_else(|| "未知错误".to_string())
        );
    }

    info!("系统代理重置成功 (处理器: {})", result.handler_used);
    Ok(())
}

/// 更新核心权限
pub async fn update_core_permissions(core_path: std::path::PathBuf) -> Result<()> {
    let operation = PrivilegedOperation::UpdateCorePermissions { core_path };

    let result = PrivilegeManager::global()
        .execute_operation(operation)
        .await?;

    if !result.success {
        anyhow::bail!(
            "更新核心权限失败: {}",
            result.message.unwrap_or_else(|| "未知错误".to_string())
        );
    }

    info!("核心权限更新成功 (处理器: {})", result.handler_used);
    Ok(())
}

/// 修改网络设置
pub async fn modify_network_settings(dns: Option<Vec<String>>) -> Result<()> {
    let operation = PrivilegedOperation::ModifyNetworkSettings { dns };

    let result = PrivilegeManager::global()
        .execute_operation(operation)
        .await?;

    if !result.success {
        anyhow::bail!(
            "修改网络设置失败: {}",
            result.message.unwrap_or_else(|| "未知错误".to_string())
        );
    }

    info!("网络设置修改成功 (处理器: {})", result.handler_used);
    Ok(())
}

/// 切换系统代理（保持与现有API兼容）
pub async fn toggle_system_proxy() -> Result<()> {
    let current_enable = Config::verge()
        .latest()
        .enable_system_proxy
        .unwrap_or(false);
    
    set_system_proxy(!current_enable).await
}

/// 切换TUN模式（保持与现有API兼容）
pub async fn toggle_tun_mode() -> Result<()> {
    let current_enable = Config::verge()
        .latest()
        .enable_tun_mode
        .unwrap_or(false);
    
    set_tun_mode(!current_enable).await
}

/// 智能权限操作：根据当前状态和用户配置自动选择最佳方式
pub async fn smart_proxy_operation(enable: bool) -> Result<()> {
    let privilege_manager = PrivilegeManager::global();
    let status = privilege_manager.get_privilege_status().await;

    // 根据权限状态选择最佳策略
    match (status.service_available, status.service_connected) {
        (true, true) => {
            info!("使用服务模式进行代理操作");
            set_system_proxy(enable).await
        }
        (true, false) => {
            info!("服务可用但未连接，尝试启动服务");
            if let Err(e) = crate::core::service::control::start_service().await {
                warn!("启动服务失败: {}, 回退到直接模式", e);
            }
            set_system_proxy(enable).await
        }
        (false, _) => {
            info!("服务不可用，使用直接模式");
            set_system_proxy(enable).await
        }
    }
}

/// 智能TUN操作
pub async fn smart_tun_operation(enable: bool) -> Result<()> {
    let privilege_manager = PrivilegeManager::global();
    let status = privilege_manager.get_privilege_status().await;

    // TUN模式对权限要求更高，优先推荐服务模式
    if enable && !status.service_connected {
        warn!("TUN模式建议使用服务模式以获得最佳体验");
        
        // 尝试自动设置服务
        if status.service_available {
            info!("尝试自动启用服务模式");
            if let Err(e) = privilege_manager.set_privilege_mode(crate::core::privilege::PrivilegeMode::Service).await {
                warn!("自动启用服务模式失败: {}", e);
            }
        }
    }

    set_tun_mode(enable).await
}

/// 预检权限操作
/// 在执行实际操作前检查权限状态，给用户更好的提示
pub async fn precheck_privilege_operation(operation: &PrivilegedOperation) -> Result<bool> {
    let privilege_manager = PrivilegeManager::global();
    
    // 检查是否需要用户确认
    let needs_confirmation = privilege_manager.requires_confirmation(operation);
    
    if needs_confirmation {
        let status = privilege_manager.get_privilege_status().await;
        
        // 如果服务不可用且需要确认，建议用户设置服务模式
        if !status.service_connected {
            info!("权限操作需要确认，建议启用服务模式以获得更好的体验");
        }
    }
    
    Ok(needs_confirmation)
}

/// 权限管理初始化
/// 应该在应用启动时调用
pub async fn initialize_privilege_system() -> Result<()> {
    info!("初始化权限管理系统");
    
    let privilege_manager = PrivilegeManager::global();
    
    // 预热权限系统
    privilege_manager.warm_up().await?;
    
    // 检查当前配置
    let status = privilege_manager.get_privilege_status().await;
    info!("权限系统状态: {:?}", status);
    
    // 如果配置了服务模式但服务不可用，给出提示
    if matches!(status.current_mode, crate::core::privilege::PrivilegeMode::Service) && !status.service_connected {
        warn!("服务模式已启用但服务未运行，某些操作可能需要权限确认");
    }
    
    Ok(())
}

/// 获取权限操作建议
/// 根据当前系统状态给出权限配置建议
pub async fn get_privilege_recommendations() -> Result<Vec<String>> {
    let privilege_manager = PrivilegeManager::global();
    let status = privilege_manager.get_privilege_status().await;
    let mut recommendations = Vec::new();

    match status.current_mode {
        crate::core::privilege::PrivilegeMode::Auto => {
            if !status.service_connected && status.service_available {
                recommendations.push("建议启用服务模式以获得更丝滑的权限管理体验".to_string());
            }
        }
        crate::core::privilege::PrivilegeMode::Direct => {
            if status.service_available {
                recommendations.push("当前使用直接模式，每次操作可能需要UAC确认。建议切换到服务模式".to_string());
            }
        }
        crate::core::privilege::PrivilegeMode::Service => {
            if !status.service_connected {
                recommendations.push("服务模式已启用但服务未运行，请检查服务状态".to_string());
            } else {
                recommendations.push("服务模式运行良好，享受丝滑的权限管理体验！".to_string());
            }
        }
        crate::core::privilege::PrivilegeMode::Disabled => {
            recommendations.push("权限操作已禁用，某些功能可能无法正常使用".to_string());
        }
    }

    Ok(recommendations)
}
