import { nextSpeed, replayHint, replayKeys, within } from "mcts-commun/replay-keys.js";

/**
 * The reading of a run, period by period, as a video (mcts-commun's keys): play or pause, a period back or on, ten
 * with Shift, faster or slower. `show(t)` draws period `t`; `end()` is the run's last period.
 *
 * @typedef {{ show: (t: number) => void, end: () => number, play: HTMLButtonElement, position: HTMLInputElement,
 *   speed: HTMLElement, slower: HTMLButtonElement, faster: HTMLButtonElement, hint: HTMLElement }} PlayerParts
 */

/** @type {Array<[number, string]>} */
const SPEEDS = [[1, "1 période/s"], [2, "2 périodes/s"], [4, "4 périodes/s"], [8, "8 périodes/s"], [16, "16 périodes/s"]];

/** @param {PlayerParts} parts */
export function createPlayer(parts) {
  const { show, end, play, position, speed } = parts;
  const at = { t: 0, rate: 4, playing: false, last: 0 };
  const label = () => {
    speed.textContent = SPEEDS.find(([value]) => value === at.rate)[1];
    play.textContent = at.playing ? "Pause" : "Lecture";
  };
  const seek = (to) => {
    at.t = within(Math.round(to), end());
    position.max = String(end());
    position.value = String(at.t);
    show(at.t);
  };
  const frame = (now) => {
    if (!at.playing) return;
    if (now - at.last >= 1000 / at.rate) {
      at.last = now;
      if (at.t >= end()) return toggle();
      seek(at.t + 1);
    }
    requestAnimationFrame(frame);
  };
  const toggle = () => {
    at.playing = !at.playing;
    if (at.playing && at.t >= end()) seek(0);
    label();
    if (at.playing) requestAnimationFrame(frame);
  };
  const faster = (way) => {
    at.rate = nextSpeed(SPEEDS, at.rate, way);
    label();
  };
  const player = { t: () => at.t, end, seek, toggle, faster };
  wire(player, parts);
  label();
  return player;
}

/** The keys, the buttons and the slider, and the line of help that says them. */
function wire(player, { play, position, slower, faster, hint }) {
  const keys = replayKeys({ step: 1, bigStep: 10, whole: true });
  document.addEventListener("keydown", (event) => keys(player, event));
  play.onclick = player.toggle;
  slower.onclick = () => player.faster(-1);
  faster.onclick = () => player.faster(1);
  position.oninput = () => player.seek(Number(position.value));
  hint.textContent = replayHint({ step: "une période", bigStep: "dix", of: " de la simulation" });
}
