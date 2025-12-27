-- Enhanced clash-rs compatibility script
-- This script prevents crashes and adds missing feature support

-- compatible with ipv6 decrepation 
if config["ipv6"] ~= nil then
    config["ipv6"] = nil
    if config["dns"] ~= nil and config["dns"]["enabled"] == true then
        config["dns"]["ipv6"] = true
    end
end

-- compatible with allow lan decrepation
if config["allow_lan"] == true then
    config["allow_lan"] = nil
    config["bind_address"] = "0.0.0.0"
end

-- compatible with proxies strict port type
if config["proxies"] ~= nil and type(config["proxies"]) == "table" then
    for _, proxy in pairs(config["proxies"]) do
        if proxy["port"] ~= nil and type(proxy["port"]) == "string" then
            proxy["port"] = tonumber(proxy["port"]) or error("invalid port: " .. proxy["port"])
        end
    end
end

-- Enhanced TUN configuration compatibility for clash-rs
if config["tun"] ~= nil then
    local tun = config["tun"]
    
    -- Ensure tun section has required enable field to prevent SIGSEGV
    if tun["enable"] == nil then
        tun["enable"] = false
    end
    
    -- Remove unsupported fields that cause crashes
    local unsupported_fields = {
        "stack",                    -- clash-rs doesn't support stack selection
        "dns-hijack",              -- not supported by clash-rs
        "auto-detect-interface",   -- not supported by clash-rs
        "strict-route",            -- may cause issues
        "route-address-set",       -- advanced routing not supported
        "route-exclude-address-set", -- advanced routing not supported
        "include-uid",             -- Linux-specific feature not in clash-rs
        "exclude-uid",             -- Linux-specific feature not in clash-rs
        "include-uid-range",       -- Linux-specific feature not in clash-rs
        "exclude-uid-range",       -- Linux-specific feature not in clash-rs
        "include-android-user",    -- Android-specific
        "exclude-android-user",    -- Android-specific
        "include-package",         -- Android-specific
        "exclude-package",         -- Android-specific
    }
    
    for _, field in ipairs(unsupported_fields) do
        if tun[field] ~= nil then
            tun[field] = nil
        end
    end
    
    -- Set platform-specific device-id for macOS
    local os_name = os.getenv("OS") or ""
    if string.find(string.lower(os_name), "darwin") or 
       string.find(string.lower(os_name), "mac") then
        tun["device-id"] = "dev://utun1989"
    else
        -- Remove device-id on non-macOS platforms
        tun["device-id"] = nil
    end
    
    -- Ensure auto-route is properly set (clash-rs supports this)
    if tun["enable"] == true and tun["auto-route"] == nil then
        tun["auto-route"] = true
    end
    
    -- Set safe defaults for required fields
    if tun["enable"] == true then
        -- Provide minimal safe configuration
        if tun["inet4-address"] == nil then
            tun["inet4-address"] = {"172.19.0.1/30"}
        end
        if tun["inet6-address"] == nil then
            tun["inet6-address"] = {"fdfe:dcba:9876::1/126"}
        end
        if tun["mtu"] == nil then
            tun["mtu"] = 9000
        end
    end
end

-- Enhanced DNS configuration compatibility
if config["dns"] ~= nil then
    local dns = config["dns"]
    
    -- Remove problematic DNS fields for clash-rs
    local unsupported_dns_fields = {
        "proxy-server-nameserver",  -- not supported
        "direct-nameserver",        -- not supported
        "direct-nameserver-follow-policy", -- not supported
        "respect-rules",            -- may cause issues
    }
    
    for _, field in ipairs(unsupported_dns_fields) do
        if dns[field] ~= nil then
            dns[field] = nil
        end
    end
    
    -- Ensure DNS has safe defaults when enabled
    if dns["enable"] == true then
        if dns["nameserver"] == nil or #dns["nameserver"] == 0 then
            dns["nameserver"] = {"114.114.114.114", "8.8.8.8"}
        end
        if dns["enhanced-mode"] == nil then
            dns["enhanced-mode"] = "fake-ip"
        end
        if dns["fake-ip-range"] == nil then
            dns["fake-ip-range"] = "198.18.0.1/16"
        end
    end
end

-- Remove experimental features that may crash clash-rs
if config["experimental"] ~= nil then
    local experimental = config["experimental"]
    
    -- Remove potentially problematic experimental features
    local risky_experimental = {
        "sniff-tls-sni",
        "fingerprint",
        "quic-go-disable-gso",
    }
    
    for _, feature in ipairs(risky_experimental) do
        if experimental[feature] ~= nil then
            experimental[feature] = nil
        end
    end
end

-- Ensure profile has basic required sections to prevent parsing errors
if config["proxies"] == nil then
    config["proxies"] = {}
end

if config["proxy-groups"] == nil then
    config["proxy-groups"] = {}
end

if config["rules"] == nil then
    config["rules"] = {}
end

-- Set safe defaults for core configuration
if config["mixed-port"] == nil and config["port"] == nil and config["socks-port"] == nil then
    config["mixed-port"] = 7890
end

return config
