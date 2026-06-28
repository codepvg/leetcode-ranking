document.addEventListener("DOMContentLoaded", () => {
  // Inject actual bad path
  const p = window.location.pathname;

  const cdLine = document.getElementById("cd-line");
  const pathDisplay = document.getElementById("path-display");

  if (cdLine) cdLine.textContent = " cd " + p;
  if (pathDisplay) pathDisplay.textContent = p;
});
