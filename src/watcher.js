"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chokidar = require("chokidar");
var Path = require("node:path");
var watcher = chokidar.watch(['./src', '*'], { persistent: true });
console.log("WATCHER INIT");
watcher.on('change', function (filePath) {
    var _a, _b, _c;
    var nonReloadable = ['watcher.ts', 'instrumentation.ts'];
    if (nonReloadable.find(function (s) { return filePath.endsWith(s); })) {
        console.log("Terminated cause of watcher change");
        process.exit(0);
    }
    if (filePath.endsWith('d.ts'))
        return;
    try {
        console.log("File Change ".concat(filePath));
        var resolvedPath = Path.resolve(process.cwd(), filePath);
        // Find and remove the module from the cache
        var key = (Object.entries(require.cache).find(function (_a) {
            var k = _a[0];
            return k.endsWith(filePath) || k.endsWith(filePath.replaceAll("\\", "/"));
        }) || [])[0];
        if (!key)
            key = resolvedPath;
        if (require.cache[key]) {
            delete require.cache[key];
        }
        // Reload the module
        var newModule = require(key);
        var called_1 = [];
        Object.entries(require.cache).forEach(function (_a) {
            var _b, _c, _d;
            var cacheKey = _a[0], module = _a[1];
            if (((_b = module === null || module === void 0 ? void 0 : module.exports) === null || _b === void 0 ? void 0 : _b.unity_hotreload) && !called_1.includes(cacheKey)) {
                console.log("HOT RELOAD ".concat((_c = cacheKey.split("\\")) === null || _c === void 0 ? void 0 : _c.slice(-2).join("/")));
                delete require.cache[cacheKey];
                var exports_1 = require(cacheKey);
                (_d = exports_1.unity_hotreload) === null || _d === void 0 ? void 0 : _d.call(exports_1);
                called_1.push(cacheKey);
            }
        });
        if (!called_1.includes(key) && newModule.unity_hotreload) {
            console.log("HOT RELOAD Current Module ".concat((_a = key.split("\\")) === null || _a === void 0 ? void 0 : _a.at(-1)));
            if (newModule.unity_hotreload) {
                (_b = newModule.unity_hotreload) === null || _b === void 0 ? void 0 : _b.call(newModule);
            }
        }
    }
    catch (e) {
        console.log("FAIL TO APPLY CHANGE ON ".concat(filePath), (_c = e === null || e === void 0 ? void 0 : e.message) !== null && _c !== void 0 ? _c : e);
    }
});
require('./index');
require('./instrumentation').register();
