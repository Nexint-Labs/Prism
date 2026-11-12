const { validTypes } = require("#config/essential/validTypes")

/**
 * Assert a string
 * @param {String} string 
 * @param {String} name 
 * @returns {String}
 */
const assertString = function (string, name) {
    if (typeof name !== "string") {
        throw new TypeError(`The assertString name is not string. (${typeof name})`)
    }
    if (typeof string !== "string") {
        throw new TypeError(`${name} is not string`)
    }
    return string;
}

/**
 * Assert an array
 * @param {Array} array 
 * @param {String} name 
 * @returns {Array}
 */
const assertArray = function (array, name) {
    if (typeof name !== "string") {
        throw new TypeError(`The assertArray name is not string. (${typeof name})`)
    }
    if (!Array.isArray(array)) {
        throw new TypeError(`${name} is not an array.`)
    }
    return array;
}

/**
 * Assert a strict array or array type
 * @param {Array} array 
 * @param {String} name 
 * @param {String} type 
 * @returns {Array}
 */
const assertStrictArray = function (array, name, type) {
    assertArray(array, name);
    if (!validTypes.has(type)) {
        throw new TypeError(`Invalid type validator. (${type})`);
    }
    for (let i = 0; i < array.length; i++) {
        if (typeof array[i] !== type) {
            throw new TypeError(`Element ${i} of array ${name} is not type ${type}.`)
        }
        if(array[i] === null){
            throw new TypeError(`Element ${i} of array ${name} is null.`)
        }
        if(typeof array[i] === "number"){
            assertFinite(array[i], `${name}[${i}]`);
        }
    }
    return array;
}

/**
 * Assert a finite number
 * @param {Number} num 
 * @param {String} name 
 * @returns {Number}
 */
const assertFinite = function(num, name){
    if (typeof name !== "string") {
        throw new TypeError(`The assertFinite name is not string. (${typeof name})`)
    }
    if (typeof num !== "number") {
        throw new TypeError(`${name} is not a number. (${typeof num})`)
    }
    if(!Number.isFinite(num)){
        throw new TypeError(`${name} is not a finite number. (${num})`);
    }
    return num;
}

/**
 * Asserts an object.
 * @param {Object} obj 
 * @param {String} name 
 * @returns {Object}
 */
const assertObject = function(obj, name){
    if (typeof name !== "string"){
        throw new TypeError(`The assertObject name is not string. (${typeof name})`)
    }
    if(typeof obj !== "object" || obj === null || Array.isArray(obj)){
        throw new TypeError(`${name} is not an object. (${typeof obj})`)
    }
    return obj;
}

/**
 * Asserts a boolean.
 * @param {Boolean} bool
 * @param {String} name 
 * @returns {Boolean}
 */
const assertBoolean = function(bool, name){
    if (typeof name !== "string"){
        throw new TypeError(`The assertBoolean name is not string. (${typeof name})`)
    }
    if(typeof bool !== "boolean"){
        throw new TypeError(`${name} is not a boolean. (${typeof bool})`)
    }
    return bool;
}

module.exports = {
    assertString,
    assertArray,
    assertStrictArray,
    assertFinite,
    assertObject,
    assertBoolean
}