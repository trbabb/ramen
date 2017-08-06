import {Map, List} from 'immutable'
import * as _      from 'lodash'


export class TypeSignature {
    
    
    constructor(sink_types={},source_types={}) {
        this.sink_types   = new Map(sink_types)
        this.source_types = new Map(source_types)
    }
    
    
    // "mutators"
    
    
    addPort(port_id, type_obj, is_sink=false) {
        var ts = _.clone(this)
        if (is_sink) {
            ts.sink_types = ts.sink_types.add(port_id)
        } else {
            ts.source_types  = ts.source_types.add(port_id)
        }
        return ts
    }
    
    
    removePort(port_id, is_sink) {
        var ts = _.clone(this)
        if (is_sink) {
            ts.sink_types = ts.sink_types.remove(port_id)
        } else {
            ts.source_types = ts.source_types.remove(port_id)
        }
        return ts
    }
    
    
    // getters
    
    
    getSourceIDs()  { return this.source_types.keySeq() }
    
    getSinkIDs()    { return this.sink_types.keySeq() }
    
    numSinks()      { return this.sink_types.size }
    
    numSources()    { return this.source_types.size }
    
    getAllPorts() {
        var m = new List().asMutable()
        for (let [port_id, t] of this.sink_types) {
            m.push({
                port_id : port_id,
                is_sink : true,
                type    : t,
            })
        }
        for (let [port_id, t] of this.source_types) {
            m.push({
                port_id : port_id,
                is_sink : false,
                type    : t,
            })
        }
        return m.asImmutable()
    }
    
    
}