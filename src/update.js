import update from 'immutability-helper';


// Update a nested JS object assuming that all parent keys exist.
// `obj`  : A js object to copy-update (will remain unchanged)
// `keys` : A "path" of keys in the nested JS object to update.
// `val`  : Value to set.
export function deepUpdate(obj, keys, val, command="$set") {
    var kk = keys.slice() // dupe array
    var u = {} // full nested update array, e.g. {a : {b : {c : val}}}
    var v = u  // current leaf array
    while (kk.length > 0) {
        let k = kk.shift()
        let w = {}
        if (kk.length === 0) {
            w[command] = val
        }
        v[k] = w
        v    = w
    }
    return update(obj, u);
}


// Update a nested JS object and create new, empty JS objects if any 
// parent element doesn't exist.
// `obj`   : Object to copy-update (argument remains unaffected).
// `keys`  : A "path" of keys in the nested JS object to update.
// `val`   : New value.
// `types` : A list of constructors as a funciton of nesting depth, for creating missing parents.
//           - In the case of "$set" commands, the final constructor is not needed, since 
//             the value is provided directly. 
//           - If no constructor is provided for a given depth, values are initialized as empty Objects.
//           - Nesting depths that are guaranteed to have an initialized parent simply will never 
//             access the constructor for that depth.
export function lazyDeepUpdate(obj, keys, val, types=null, command="$set") {
    // note: We probably do some redundant object copying along the descent path.
    //       It's probably even worse for multiple commands. If this function were internal
    //       to immutability-helper, it could probably be more efficient.
    
    var k_remaining = keys.slice(); // dupe array
    var k_shifted   = [];
    var cur         = obj; // object at current "nesting level"
    var depth       = 0;
    var descend_to  = (command === "$set") ? 1 : 0;
    
    // initialize the ancestors
    while (k_remaining.length > descend_to) {
        let k = k_remaining.shift();
        k_shifted.push(k);
        if (!(k in cur)) {
            var new_obj = (types === null || types[depth] === null || types[depth] === undefined) ? {} : types[depth]();
            obj = deepUpdate(obj, k_shifted, new_obj);
            cur = new_obj;
        } else {
            cur = cur[k];
        }
        ++depth;
    }
    
    // now that the chain of ancestors exists, this is safe:
    obj = deepUpdate(obj, keys, val, command);
    
    return obj;
}
