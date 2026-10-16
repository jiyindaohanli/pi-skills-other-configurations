# pi skills & extensions 同步

本仓库只保存 pi（@earendil-works/pi-coding-agent）的 **skills（技能）** 和 **extensions（扩展）**，用于在新电脑上安装 pi 后恢复这两部分。

## 仓库内容

| 目录 | 用途 |
|---|---|
| `skills/` | 全部技能（grilling、coding-principles、go-zero-spec、novel 系列、前端设计系列、ppt-master 等） |
| `extensions/` | 自定义扩展（tab-completion-indicator.ts 标签页状态、rtk.ts、confirm-alert.ts.disabled、pi-permission-system 配置） |

**不包含**：settings.json、mcp.json、models.json、auth.json（API key）等 pi 其他配置与敏感信息，需要在新机器上单独配置。

## 新电脑恢复步骤

1. 安装 pi：

   ```bash
   npm install -g @earendil-works/pi-coding-agent
   ```

2. 把 skills 和 extensions 复制到 pi 的用户配置目录（Windows 默认 `~\.pi\agent`，macOS/Linux 为 `~/.pi/agent`）：

   ```powershell
   # Windows (PowerShell)
   git clone https://github.com/jiyindaohanli/pi-skills-other-configurations.git "$env:TEMP\pi-sync"
   Copy-Item "$env:TEMP\pi-sync\skills"  "$env:USERPROFILE\.pi\agent\skills"  -Recurse -Force
   Copy-Item "$env:TEMP\pi-sync\extensions" "$env:USERPROFILE\.pi\agent\extensions" -Recurse -Force
   ```

   ```bash
   # macOS / Linux
   git clone https://github.com/jiyindaohanli/pi-skills-other-configurations.git /tmp/pi-sync
   cp -r /tmp/pi-sync/skills      ~/.pi/agent/skills
   cp -r /tmp/pi-sync/extensions  ~/.pi/agent/extensions
   ```

3. 其余配置（默认模型、API key、MCP 服务器、packages）在新机器上单独执行 `pi` 引导或 `pi auth login` 完成。

## 日常同步

在任意一台机器上更新了 skills / extensions 后：

```bash
# 在本仓库的工作副本里
git add -A && git commit -m "sync" && git pull --rebase && git push
```

其他机器上重新执行上面的复制步骤即可。
