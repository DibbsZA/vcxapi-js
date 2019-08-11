# VCXS API Client

HTTP Client to call VCXS API.

## Known issues

When running whole test suite `npm run test`

```text
 FAIL  test/integration/challenges.spec.js
  ● Test suite failed to run

    RangeError: Maximum call stack size exceeded

      at debug (node_modules/ref/node_modules/debug/src/debug.js:1:1)
      at Object.writePointer [as _writePointer] (node_modules/ref/lib/ref.js:746:3)
      at Object.writePointer [as _writePointer] (node_modules/ref/lib/ref.js:747:11)
      at Object.writePointer [as _writePointer] (node_modules/ref/lib/ref.js:747:11)
      at Object.writePointer [as _writePointer] (node_modules/ref/lib/ref.js:747:11)
      at Object.writePointer [as _writePointer] (node_modules/ref/lib/ref.js:747:11)
      at Object.writePointer [as _writePointer] (node_modules/ref/lib/ref.js:747:11)
      at Object.writePointer [as _writePointer] (node_modules/ref/lib/ref.js:747:11)
      at Object.writePointer [as _writePointer] (node_modules/ref/lib/ref.js:747:11)
      at Object.writePointer [as _writePointer] (node_modules/ref/lib/ref.js:747:11)
```

Due to <https://github.com/facebook/jest/issues/6389>
