/**
 * Tab Status Icons Extension（统一的 4 态状态图标）
 *
 * 用「标签页标题 emoji + Windows Terminal 进度环形态」区分 4 种状态，
 * 不弹任何对话框 / Toast：
 *
 *   1. 正常（空闲）：进度环清除，标题为 pi 默认标题
 *   2. 运行中：      ⏳ 标题 + OSC 9;4;3 旋转环（转圈动画）
 *   3. 需要确认：    ⏸ 标题 + OSC 9;4;4;0 静态空环 + BEL 闪烁一次（需用户审批/输入时）
 *   4. 运行结束：    ✅ 标题 + OSC 9;4;1;100 满格环保留（正常完成）
 *                    ❌ 标题 + 进度环清除（出错）
 *                    ⏹ 标题 + 进度环清除（用户中断）
 *
 * 说明：Windows Terminal 的进度环颜色固定用系统强调色（默认蓝色），
 * 状态字节只影响填充比例/动画，不影响颜色（微软未合并换色 PR #15847）。
 * 因此 4 种状态靠「旋转 vs 静态 vs 满格 vs 无环」+ 标题 emoji 区分。
 *
 * 环境变量：
 *   PI_STATUS_FLASH=0  关闭"需要确认"时的标签闪烁（默认开）
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const FLASH_ON_CONFIRM = process.env.PI_STATUS_FLASH !== "0";

/** 运行时安全地写转义序列（print/json 模式下 stdout 用于输出，不能污染） */
function safeWrite(write: () => void): void {
	if (!process.stdout.isTTY) return;
	try {
		write();
	} catch {
		// 忽略写失败
	}
}

/** 截取任务摘要（去换行、限长） */
function summarize(prompt: string, max = 36): string {
	const oneLine = prompt.replace(/\s+/g, " ").trim();
	return oneLine.length > max ? oneLine.slice(0, max) + "…" : oneLine;
}

/** 设置标签页标题（OSC 0，所有主流终端都支持） */
function setTitle(title: string): void {
	process.stdout.write(`\x1b]0;${title}\x07`);
}

/** 状态 2：运行中 —— 旋转环 + ⏳ */
function markRunning(prompt: string): void {
	// OSC 9;4 ; state=3 (indeterminate) → 旋转动画环
	process.stdout.write(`\x1b]9;4;3;0\x07`);
	setTitle(`⏳ Pi · ${summarize(prompt)}`);
}

/** 状态 3：需要确认 —— 静态空环 + ⏸ + 闪烁一次 */
function markWaitingConfirm(prompt: string): void {
	// OSC 9;4 ; state=4 ; 0 → 静态 0% 环，与旋转环形态明显不同
	process.stdout.write(`\x1b]9;4;4;0\x07`);
	setTitle(`⏸ Pi · ${summarize(prompt)}`);
	if (FLASH_ON_CONFIRM) {
		// 单次 BEL：bellStyle=window 时标签闪烁不响铃
		safeWrite(() => process.stdout.write("\x07"));
	}
}

/** 状态 4a：正常完成 —— 满格环保留 + ✅ */
function markDone(prompt: string): void {
	// OSC 9;4 ; state=1 ; 100 → 满格环（Windows 强调色，默认蓝色）持续保留
	process.stdout.write(`\x1b]9;4;1;100\x07`);
	setTitle(`✅ Pi · ${summarize(prompt)}`);
}

/** 状态 4b：出错 —— 清环 + ❌ */
function markError(prompt: string): void {
	process.stdout.write(`\x1b]9;4;0;0\x07`);
	setTitle(`❌ Pi · ${summarize(prompt)}`);
}

/** 状态 4c：用户中断 —— 清环 + ⏹ */
function markAborted(prompt: string): void {
	process.stdout.write(`\x1b]9;4;0;0\x07`);
	setTitle(`⏹ Pi · ${summarize(prompt)}`);
}

/** 状态 1：恢复正常（空闲）—— 清环 + 默认标题 */
function markIdle(): void {
	process.stdout.write(`\x1b]9;4;0;0\x07`);
	const cwd = process.cwd().split(/[\\/]/).pop() ?? "";
	setTitle(`π - ${cwd}`);
}

/** 从 agent_end 的消息里判断最后一轮的结束原因 */
function lastStopReason(messages: unknown[]): "stop" | "error" | "aborted" | "unknown" {
	for (let i = messages.length - 1; i >= 0; i--) {
		const msg = messages[i] as { role?: string; stopReason?: string } | undefined;
		if (msg && msg.role === "assistant" && typeof msg.stopReason === "string") {
			if (msg.stopReason === "stop") return "stop";
			if (msg.stopReason === "error") return "error";
			if (msg.stopReason === "aborted") return "aborted";
			return "unknown";
		}
	}
	return "unknown";
}

export default function (pi: ExtensionAPI) {
	let isBusy = false;
	let isWaitingConfirm = false;
	let lastPrompt = "";

	// 状态 2：任务开始 —— 旋转环 + ⏳
	pi.on("before_agent_start", (event) => {
		isBusy = true;
		isWaitingConfirm = false;
		lastPrompt = event.prompt;
		safeWrite(() => markRunning(event.prompt));
	});

	// 状态 3：pi 真正弹出阻塞式 UI 对话框（工具审批/确认/选择/输入）时触发
	pi.on("ui_prompt_start", (event) => {
		if (!isBusy) return; // 空闲时的交互不占用状态
		isWaitingConfirm = true;
		safeWrite(() => markWaitingConfirm(lastPrompt || event.kind));
	});

	// 对话框关闭 —— 回到运行中状态（若任务已结束则由 agent_settled 覆盖）
	pi.on("ui_prompt_end", () => {
		if (!isBusy || !isWaitingConfirm) return;
		isWaitingConfirm = false;
		safeWrite(() => markRunning(lastPrompt));
	});

	// 记录本轮结束原因（agent_end 在 agent_settled 之前触发）
	let endedWithError = false;
	let endedAborted = false;
	pi.on("agent_end", (event) => {
		const reason = lastStopReason(event.messages ?? []);
		endedWithError = reason === "error";
		endedAborted = reason === "aborted";
	});

	// 状态 4 / 状态 1：任务收尾（正常完成 / 出错 / 中断）
	pi.on("agent_settled", (event) => {
		if (!isBusy) return; // 避免重复通知
		isBusy = false;
		isWaitingConfirm = false;
		const aborted = event.aborted || endedAborted;
		safeWrite(() => {
			if (endedWithError) markError(lastPrompt);
			else if (aborted) markAborted(lastPrompt);
			else markDone(lastPrompt);
		});
		endedWithError = false;
		endedAborted = false;
	});

	// 会话关闭时恢复默认标题、清掉进度环
	pi.on("session_shutdown", () => {
		safeWrite(() => markIdle());
	});
}
