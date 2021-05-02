export class Position {
  public x: number = 0;
  public y: number = 0;
}

export class Speed {
  constructor(public value: number = 15) {}
}

export class Time {
  dt: number = 1;
}
