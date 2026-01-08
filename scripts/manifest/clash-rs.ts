import { ClashManifest } from 'types'
import { SupportedArch } from '../types'

export const CLASH_RS_MANIFEST: ClashManifest = {
  URL_PREFIX: 'https://github.com/Watfaq/clash-rs/releases/download/',
  VERSION: 'v1.0.0', // This will be resolved dynamically
  ARCH_MAPPING: {
    [SupportedArch.WindowsX86_32]: 'clash-i686-pc-windows-msvc-static-crt.exe',
    [SupportedArch.WindowsX86_64]: 'clash-x86_64-pc-windows-msvc.exe',
    [SupportedArch.WindowsArm64]: 'clash-aarch64-pc-windows-msvc.exe',
    [SupportedArch.LinuxAarch64]: 'clash-aarch64-unknown-linux-gnu',
    [SupportedArch.LinuxAmd64]: 'clash-x86_64-unknown-linux-gnu-static-crt',
    [SupportedArch.LinuxI386]: 'clash-i686-unknown-linux-gnu',
    [SupportedArch.DarwinArm64]: 'clash-aarch64-apple-darwin',
    [SupportedArch.DarwinX64]: 'clash-x86_64-apple-darwin',
    [SupportedArch.LinuxArmv7]: 'clash-armv7-unknown-linux-gnueabi',
    [SupportedArch.LinuxArmv7hf]: 'clash-armv7-unknown-linux-gnueabihf',
  },
}

export const CLASH_RS_ALPHA_MANIFEST: ClashManifest = {
  VERSION_URL:
    'https://github.com/Watfaq/clash-rs/releases/download/latest/version.txt',
  URL_PREFIX: 'https://github.com/Watfaq/clash-rs/releases/download/latest',
  VERSION: 'latest', // This will be resolved dynamically
  ARCH_MAPPING: {
    [SupportedArch.WindowsX86_32]: 'clash-i686-pc-windows-msvc-static-crt.exe',
    [SupportedArch.WindowsX86_64]: 'clash-x86_64-pc-windows-msvc.exe',
    [SupportedArch.WindowsArm64]: 'clash-aarch64-pc-windows-msvc.exe',
    [SupportedArch.LinuxAarch64]: 'clash-aarch64-unknown-linux-gnu',
    [SupportedArch.LinuxAmd64]: 'clash-x86_64-unknown-linux-gnu-static-crt',
    [SupportedArch.LinuxI386]: 'clash-i686-unknown-linux-gnu',
    [SupportedArch.DarwinArm64]: 'clash-aarch64-apple-darwin',
    [SupportedArch.DarwinX64]: 'clash-x86_64-apple-darwin',
    [SupportedArch.LinuxArmv7]: 'clash-armv7-unknown-linux-gnueabi',
    [SupportedArch.LinuxArmv7hf]: 'clash-armv7-unknown-linux-gnueabihf',
  },
}
