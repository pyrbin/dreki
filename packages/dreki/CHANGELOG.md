# dreki

## 0.0.14

### Patch Changes

- c513318: merged shared & collections packages
- Updated dependencies [c513318]
  - @dreki.land/shared@0.0.9

## 0.0.13

### Patch Changes

- 992c3cc: query cache & unique query id

## 0.0.12

### Patch Changes

- 33666ce: cleanup & overall refactoring

  - switched from `snake_case` to `camelCase`
  - replaced `@swc/jest` with `esbuild-runner`
  - use [private field hash `#` prefix](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields) (still not sure about this)

- Updated dependencies [33666ce]
  - @dreki.land/collections@0.0.8
  - @dreki.land/shared@0.0.8

## 0.0.11

### Patch Changes

- 95cbe1b: fixed `World.single` undefined storage error
- 9f3e0b7: bugfix `World.register` correctly creates storage for component
- b686282: added commands feature

## 0.0.10

### Patch Changes

- f3aadf3: system execution resource guard

## 0.0.9

### Patch Changes

- f560129: startup stages & more default stages

## 0.0.8

### Patch Changes

- 0c8e197: added simple events feature

  - inspired by [events in bevy](https://docs.rs/bevy_app/0.5.0/bevy_app/struct.Events.html)

- Updated dependencies [ebae067]
- Updated dependencies [48eb3cf]
  - @dreki.land/shared@0.0.7
  - @dreki.land/collections@0.0.7

## 0.0.7

### Patch Changes

- 518f7f7: added initial plugin implementation
- 9189bec: minor bugfixes

  - `getWithState` correctly returns undefined
  - `'has'`-functions always returns a boolean

- 86a5a13: improved removed filter
- 471ca6c: use integers as entity id

## 0.0.6

### Patch Changes

- f5b2960: fixed circular dependencies
- Updated dependencies [f5b2960]
  - @dreki.land/collections@0.0.6
  - @dreki.land/shared@0.0.6

## 0.0.5

### Patch Changes

- 01d482f: initial impl. for reliable change detection
- b2fc9b4: added singleton getter
- Updated dependencies [01d482f]
  - @dreki.land/shared@0.0.5
  - @dreki.land/collections@0.0.5

## 0.0.4

### Patch Changes

- fa116d1: Added inheritance based component storage
- Updated dependencies [fa116d1]
  - @dreki.land/collections@0.0.4
  - @dreki.land/shared@0.0.4

## 0.0.3

### Patch Changes

- dcdcbd7: initial release
- Updated dependencies [dcdcbd7]
  - @dreki.land/collections@0.0.1
  - @dreki.land/shared@0.0.1
