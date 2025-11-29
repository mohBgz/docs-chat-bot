(function () {
  const iframe = document.createElement("iframe");
  iframe.className = "chat-widget";

  // Set source
  iframe.src = "http://localhost:5173"; // or your deployed URL

  document.body.appendChild(iframe);


 const overlay = document.getElementById("chat-overlay");
 console.log(overlay);

  // Listen for messages from the iframe to toggle overlay
  window.addEventListener("message", (event) => {
    if (!event.data || event.data.type !== "TOGGLE_CHAT_OVERLAY") return;

    if (event.data.isOpen) {
      overlay.style.display = "block";
    } else {
      overlay.style.display = "none";
    }
  });

  // Close panel if overlay is clicked
  overlay.addEventListener("click", () => {
    iframe.contentWindow.postMessage({ type: "CLOSE_PANEL" }, "*");
  });
})();
