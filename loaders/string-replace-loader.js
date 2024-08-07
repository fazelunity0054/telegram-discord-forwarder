// loaders/string-replace-loader.js
module.exports = function(source) {
    return source.replace(/"AbortSignal"!==p\.constructor\.name/g, 'false');
};
