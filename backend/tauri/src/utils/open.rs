use std::ffi::OsStr;

pub fn that<T: AsRef<OsStr>>(path: T) -> std::io::Result<()> {
    open::that(path)
}
