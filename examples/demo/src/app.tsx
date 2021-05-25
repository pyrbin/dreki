import { h, Fragment } from "preact";
import { useEffect } from "preact/hooks";
import { world } from "./world";

export function App() {
  useEffect(() => {
    let running = true;

    const update = () => {
      if (running) {
        world.update();
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);

    return () => {
      running = false;
    };
  }, []);

  return (
    <>
      <h1 style="font-size:64px;">🐉</h1>
      <a
        class="link"
        href="https://github.com/pyrbin/dreki"
        target="_blank"
        rel="noopener noreferrer"
      >
        dreki @ github
      </a>
    </>
  );
}
