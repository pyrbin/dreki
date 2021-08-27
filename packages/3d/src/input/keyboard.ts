import { events, res } from "dreki";
import { ElementState, Input } from "./input";

/**
 * Keyboard input event store
 */
export class Keyboard extends Input<Key> {}

/**
 * Mouse button input event
 */
export class KeyboardInput {
  constructor(readonly key: Key, readonly state: ElementState) {}
}

/**
 * Keyboard input system
 */
export function keyboardInputSystem() {
  const keyboard = res(Keyboard);
  const keyboardInputs = events(KeyboardInput);

  keyboard.clear();
  for (const event of keyboardInputs.iter()) {
    switch (event.state) {
      case ElementState.Released: {
        keyboard.release(event.key);
        break;
      }
      case ElementState.Pressed: {
        keyboard.press(event.key);
        break;
      }
    }
  }
}

/**
 * A keyboard key.
 */
export enum Key {
  Backspace = "Backspace",
  Tab = "Tab",
  Enter = "Enter",
  ShiftLeft = "ShiftLeft",
  ShiftRight = "ShiftRight",
  ControlLeft = "ControlLeft",
  ControlRight = "ControlRight",
  AltLeft = "AltLeft",
  AltRight = "AltRight",
  Pause = "Pause",
  CapsLock = "CapsLock",
  Escape = "Escape",
  PageUp = "PageUp",
  Space = "Space",
  PageDown = "PageDown",
  End = "End",
  Home = "Home",
  ArrowLeft = "ArrowLeft",
  ArrowUp = "ArrowUp",
  ArrowRight = "ArrowRight",
  ArrowDown = "ArrowDown",
  PrintScreen = "PrintScreen",
  Insert = "Insert",
  Delete = "Delete",
  Key0 = "Digit0",
  Key1 = "Digit1",
  Key2 = "Digit2",
  Key3 = "Digit3",
  Key4 = "Digit4",
  Key5 = "Digit5",
  Key6 = "Digit6",
  Key7 = "Digit7",
  Key8 = "Digit8",
  Key9 = "Digit9",
  A = "KeyA",
  B = "KeyB",
  C = "KeyC",
  D = "KeyD",
  E = "KeyE",
  F = "KeyF",
  G = "KeyG",
  H = "KeyH",
  J = "KeyJ",
  K = "KeyK",
  L = "KeyL",
  M = "KeyM",
  N = "KeyN",
  O = "KeyO",
  P = "KeyP",
  Q = "KeyQ",
  R = "KeyR",
  S = "KeyS",
  T = "KeyT",
  U = "KeyU",
  V = "KeyV",
  W = "KeyW",
  X = "KeyX",
  Y = "KeyY",
  Z = "KeyZ",
  MetaLeft = "MetaLeft",
  MetaRight = "MetaRight",
  ContextMenu = "ContextMenu",
  Numpad0 = "Numpad0",
  Numpad1 = "Numpad1",
  Numpad2 = "Numpad2",
  Numpad3 = "Numpad3",
  Numpad4 = "Numpad4",
  Numpad5 = "Numpad5",
  Numpad6 = "Numpad6",
  Numpad7 = "Numpad7",
  Numpad8 = "Numpad8",
  Numpad9 = "Numpad9",
  NumpadMultiply = "NumpadMultiply",
  NumpadAdd = "NumpadAdd",
  NumpadSubtract = "NumpadSubtract",
  NumpadDecimal = "NumpadDecimal",
  NumpadDivide = "NumpadDivide",
  F1 = "F1",
  F2 = "F2",
  F3 = "F3",
  F4 = "F4",
  F5 = "F5",
  F6 = "F6",
  F7 = "F7",
  F8 = "F8",
  F9 = "F9",
  F10 = "F10",
  F11 = "F11",
  F12 = "F12",
  NumLock = "NumLock",
  ScrollLock = "ScrollLock",
  AudioVolumeMute = "AudioVolumeMute",
  AudioVolumeDown = "AudioVolumeDown",
  AudioVolumeUp = "AudioVolumeUp",
  LaunchMediaPlayer = "LaunchMediaPlayer",
  LaunchApplication1 = "LaunchApplication1",
  LaunchApplication2 = "LaunchApplication2",
  Semicolon = "Semicolon",
  Equal = "Equal",
  Comma = "Comma",
  Minus = "Minus",
  Period = "Period",
  Slash = "Slash",
  Backquote = "Backquote",
  BracketLeft = "BracketLeft",
  Backslash = "Backslash",
  BracketRight = "BracketRight",
  Quote = "Quote",
}
