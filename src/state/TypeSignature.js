import {Map, Set} from 'immutable'
import * as _     from 'lodash'


export class TypeSignature {
    
    
    constructor(sink_ids={},src_ids={}) {
        this.type_by_port_id = new Map(Object.assign({}, sink_ids, src_ids))
        this.sink_ids        = new Set(Object.keys(sink_ids))
        this.src_ids         = new Set(Object.keys(src_ids))
    }
    
    
    // "mutators"
    
    
    addPort(port_id, type_id, is_sink=false) {
        var ts = _.clone(this)
        ts.type_by_port_id = ts.type_by_port_id.set(port_id, type_id)
        if (is_sink) {
            ts.sink_ids = ts.sink_ids.add(port_id)
        } else {
            ts.src_ids  = ts.src_ids.add(port_id)
        }
        return ts
    }
    
    
    removePort(port_id) {
        var ts = _.clone(this)
        ts.type_by_port_id = ts.type_by_port_id.remove(port_id)
        if (ts.sink_ids.has(port_id)) {
            ts.sink_ids = ts.sink_ids.remove(port_id)
        } else {
            ts.src_ids = ts.src_ids.remove(port_id)
        }
        return ts
    }
    
    
    // getters
    
    
    getSourceIDs()  { return this.src_ids }
    
    getSinkIDs()    { return this.sink_ids }
    
    isSink(port_id) { return this.sink_ids.has(port_id) }
    
    numSinks()      { return this.sink_ids.size }
    
    numSources()    { return this.src_ids.size }
    
    
}