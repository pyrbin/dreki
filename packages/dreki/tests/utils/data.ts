export class Position {
  constructor(public x: number = 0, public y: number = 0) {}
  dispose() {
    this.x = -1;
  }
}

export class Scale {
  constructor(public a: number = 0, public b: number = 0) {}
}

export class Tag {}

export class IsPlayer {}

export class Time {
  constructor(public dt: number = 0) {}
}
