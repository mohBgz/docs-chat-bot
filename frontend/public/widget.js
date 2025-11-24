(function () {
  // Create iframe
  const iframe = document.createElement("iframe");

  // Full-screen responsive
  Object.assign(iframe.style, {
    position: "fixed",
    bottom: "0",
    right: "0",
    left: "0",
    top: "0",
    width: "100%",
    height: "100%",
    border: "none",
    zIndex: "999999",
    background: "transparent",
  });

  // Set source to your deployed widget URL
  //iframe.src = "http://localhost:5173"; // LOCAL for testing purposes
  iframe.src = "https://echobot.mohamedbgz.dev"; // link for deployed version

  
  document.body.appendChild(iframe);
})();
