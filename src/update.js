import update from 'immutability-helper';


// Update a nested JS object assuming that all parent keys exist.
// `obj`  : A js object to copy-update (will remain unchanged)
// `keys` : A "path" of keys in the nested JS object to update.
// `val`  : Value to set.
export function deepUpdate(obj, keys, val) {
    var kk = keys.slice() // dupe array
    var u = {} // full nested update array, e.g. {a : {b : {c : val}}}
    var v = u  // current leaf array
    while (kk.length > 0) {
        let k = kk.shift()
        let w = (kk.length > 0) ? {} : {$set : val}
        v[k]  = w
        v     = w
    }
    return update(obj, u);
}


// Update a nested JS object and create new, empty JS objects if any 
// parent element doesn't exist.
// `obj`   : Object to copy-update (argument remains unaffected).
// `keys`  : A "path" of keys in the nested JS object to update.
// `val`   : New value.
// `types` : A list of n-1 constructors as a funciton of nesting depth, for creating missing parents.
//           Note that a constructor for the final key is not needed, since the value is provided.
export function lazyDeepUpdate(obj, keys, val, types=null) {
    var k_remaining = keys.slice(); // dupe array
    var k_shifted   = [];
    var cur = obj;
    var depth = 0;
    
    while (k_remaining.length > 0) {
        let k = k_remaining.shift();
        k_shifted.push(k);
        if (!(k in cur) || k_remaining.length == 0) {
            // either add a new empty parent, or add the final object
            var new_obj;
            if (k_remaining.length > 0) {
                // make a new parent
                new_obj = (types === null || types[depth] === null || types[depth] === undefined) ? {} : types[depth]();
            } else {
                new_obj = val;
            }
            obj = deepUpdate(obj, k_shifted, new_obj);
            cur = new_obj;
        } else {
            cur = cur[k];
        }
        ++depth;
    };
    return obj;
}
