// Color-coded JSON display for terminal theme
const JSONColorOutput = ({ data }) => {
  if (!data) return "No response yet.";

  const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  // Regex-based syntax highlighting
  const highlighted = json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|\b-?\d+(\.\d+)?([eE][-+]?\d+)?\b)/g,
    (match) => {
      let cls = "";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      } else if (/^-?\d/.test(match)) {
        cls = "json-number";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );

  return (
    <pre
      className="terminal-output"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
};

export default JSONColorOutput;
