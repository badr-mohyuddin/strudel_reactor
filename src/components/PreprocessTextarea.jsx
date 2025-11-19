function PreprocessTextArea({ value, onChange }) {
  return (
    <>
      <label htmlFor="proc" className="form-label">Text to preprocess:</label>
      <textarea
        id="proc"
        className="form-control"
        rows={15}
        value={value}                // <-- controlled by state
        onChange={(e) => onChange(e.target.value)}  // <-- updates state
      />
    </>
  );
}

export default PreprocessTextArea;
