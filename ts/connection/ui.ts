import { handlers, message } from "./messages";
import { syncStatus } from "./state";

const syncEl = document.querySelector(".header-status");
// const syncedCount = document.getElementById("sync-counter")

function statusToClass(status: syncStatus) {
  switch (status) {
  case syncStatus.synced:
    return "fa-check";
  case syncStatus.desynced:
    return "fa-unlink";
  default:
    return "fa-spinner fa-pulse fa-fw";
  }
}

// Render connection status indicator
export function renderStatus(status: syncStatus) {
  const cls = statusToClass(status);
  syncEl.innerHTML = `<i class="fa ${cls}"></i>`;
}

// Set synced IP count to n
export function renderSyncCount(n: number) {
  // syncedCount.innerHTML = n
  //   ? `${n} <i class="fa fa-user"></i>`
  //   : ""
}

handlers[message.syncCount] = renderSyncCount;
