export class Position1D {}

export class Position extends Position1D {
  constructor(public x: number = 0, public y: number = 0) {
    super();
  }
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

export class Point {
  constructor(public x: number = 0) {}
}

export class FloatPoint extends Point {}

export class DoublePoint extends Point {}

export class ExtendedPoint extends Point {}

export class Point2D extends Point {
  constructor(x = 0, public y: number = 0) {
    super(x);
  }
}

export class Point3D extends Point2D {
  constructor(x = 0, y = 0, public z: number = 0) {
    super(x, y);
  }
}

export class Point4D extends Point3D {
  constructor(x = 0, y = 0, z = 0, public w: number = 0) {
    super(x, y, z);
  }
  dispose() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 0;
  }
}
