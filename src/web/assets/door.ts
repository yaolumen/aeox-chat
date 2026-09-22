export function initAdminDoor(): void {
  const ver = document.querySelector(".sb-ver");
  if (!ver) return;
  let clicks = 0;
  let timer = 0;
  ver.addEventListener("click", () => {
    clicks += 1;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      clicks = 0;
    }, 1200);
    if (clicks >= 3) {
      window.location.href = "/admin";
    }
  });
}
