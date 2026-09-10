## 2026-09-10 - [electron shell.openExternal Vulnerability]
**Vulnerability:** Calling shell.openExternal with an unvalidated user-controlled URL.
**Learning:** This is a common Electron anti-pattern that can lead to local RCE or NTLM credential relay (via UNC paths) since it delegates execution to the OS shell.
**Prevention:** Always validate and restrict the protocol (e.g., allow only http: or https:) before passing URLs to shell.openExternal.
