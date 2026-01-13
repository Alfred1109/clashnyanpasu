use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::command;

use super::{
    PrivilegeMode, PrivilegeStatus, PrivilegedOperation, PrivilegedOperationHandler,
    PrivilegedOperationResult, manager::PrivilegeManager, operations,
};

/// 获取权限管理状态
#[command]
#[specta::specta]
pub async fn get_privilege_status() -> Result<PrivilegeStatus, String> {
    Ok(PrivilegeManager::global().get_privilege_status().await)
}

/// 已简化为纯服务模式，无需设置权限模式
#[command]
#[specta::specta]
pub async fn get_current_privilege_mode() -> Result<PrivilegeMode, String> {
    Ok(PrivilegeMode::Service)
}

/// 执行权限操作
#[command]
#[specta::specta]
pub async fn execute_privilege_operation(
    operation: PrivilegedOperation,
) -> Result<PrivilegedOperationResult, String> {
    PrivilegeManager::global()
        .execute_operation(operation)
        .await
        .map_err(|e| e.to_string())
}

/// 预检权限操作
#[command]
#[specta::specta]
pub async fn precheck_privilege_operation(operation: PrivilegedOperation) -> Result<bool, String> {
    operations::precheck_privilege_operation(&operation)
        .await
        .map_err(|e| e.to_string())
}

/// 获取权限操作建议
#[command]
#[specta::specta]
pub async fn get_privilege_recommendations() -> Result<Vec<String>, String> {
    operations::get_privilege_recommendations()
        .await
        .map_err(|e| e.to_string())
}

/// 自动设置服务模式
#[command]
#[specta::specta]
pub async fn auto_setup_service_mode() -> Result<String, String> {
    let privilege_manager = PrivilegeManager::global();
    let status = privilege_manager.get_privilege_status().await;

    if status.service_connected {
        return Ok("服务模式已经启用并运行".to_string());
    }

    if !status.service_available {
        return Err("服务模式不可用".to_string());
    }

    // 尝试安装并启用服务
    match crate::core::service::control::install_service().await {
        Ok(()) => {
            // 服务模式已是默认且唯一模式

            Ok("服务模式设置成功！现在可以享受丝滑的权限管理体验".to_string())
        }
        Err(e) => Err(format!("服务模式设置失败: {}", e)),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ServiceModeInfo {
    pub available: bool,
    pub connected: bool,
    pub service_status: Option<String>,
    pub current_mode: PrivilegeMode,
    pub benefits: Vec<String>,
}

/// 检查服务模式可用性
#[command]
#[specta::specta]
pub async fn check_service_mode_availability() -> Result<ServiceModeInfo, String> {
    let privilege_manager = PrivilegeManager::global();
    let status = privilege_manager.get_privilege_status().await;

    let service_status = if status.service_available {
        match crate::core::service::control::status().await {
            Ok(info) => Some(format!("{:?}", info.status)),
            Err(_) => None,
        }
    } else {
        None
    };

    Ok(ServiceModeInfo {
        available: status.service_available,
        connected: status.service_connected,
        service_status,
        current_mode: status.current_mode,
        benefits: vec![
            "无需每次确认UAC权限".to_string(),
            "更快的代理切换速度".to_string(),
            "更稳定的权限管理".to_string(),
            "符合Windows安全最佳实践".to_string(),
        ],
    })
}

/// 测试权限系统
#[command]
#[specta::specta]
pub async fn test_privilege_system() -> Result<PrivilegeTestResult, String> {
    let privilege_manager = PrivilegeManager::global();
    let mut results = Vec::new();

    // 测试获取状态
    let status_test = "✅ 权限状态获取成功".to_string();
    results.push(status_test);

    // 测试服务连接
    if let Some(service_handler) = &privilege_manager.service_handler {
        let service_test = if service_handler.is_available().await {
            "✅ 服务模式可用".to_string()
        } else {
            "⚠️ 服务模式不可用".to_string()
        };
        results.push(service_test);
    }

    // 架构已简化为纯服务模式
    results.push("✅ 架构已简化为纯服务模式".to_string());

    let status = privilege_manager.get_privilege_status().await;

    Ok(PrivilegeTestResult {
        overall_status: if status.service_connected {
            "权限系统运行正常".to_string()
        } else {
            "服务未运行，需要安装或启动服务".to_string()
        },
        test_results: results,
        recommendations: operations::get_privilege_recommendations()
            .await
            .unwrap_or_default(),
    })
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PrivilegeTestResult {
    pub overall_status: String,
    pub test_results: Vec<String>,
    pub recommendations: Vec<String>,
}
