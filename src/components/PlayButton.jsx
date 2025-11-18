// src/components/PlayButton.jsx
export default function PlayButton({ evaluate, stop }) {
  const handlePlay = () => {
    if (typeof window !== "undefined") {
      // Unlock audio context in browser
      import('@strudel/webaudio').then(({ initAudioOnFirstClick }) => {
        initAudioOnFirstClick();
        evaluate?.();
      });
    }
  };

  const handleStop = () => {
    stop?.();
  };

  return (
    <div className="btn-group" role="group" aria-label="Play Controls">
      <button className="btn btn-outline-primary" onClick={handlePlay}>
        Play
      </button>
      <button className="btn btn-outline-primary" onClick={handleStop}>
        Stop
      </button>
    </div>
  );
}
