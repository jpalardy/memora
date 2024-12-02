fetch("/styles.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((styles) => {
    styles.forEach((style) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/" + style;
      document.head.appendChild(link);
    });
  })
  .catch((error) => {
    console.error("Error loading styles:", error);
  });
