---
"@dreki.land/collections": patch
"dreki": patch
"@dreki.land/shared": patch
---

cleanup & overall refactoring

- switched from `snake_case` to `camelCase`
- replaced `@swc/jest` with `esbuild-runner`
- use [private field hash `#` prefix](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields) (still not sure about this)
