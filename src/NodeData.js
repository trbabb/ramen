import {Map, Set} from 'immutable'

export class NodeData {

    constructor(name, type_sig, links=null) {
        this.name     = name
        this.type_sig = type_sig
        this.links    = (links === null) ? new Map() : links;
    }
    
    isPortSink(port_id) {
        return port_id < this.type_sig.n_sinks;
    }
    
    addLink(port_id, link_id) {
        return new NodeData(
            this.name,
            this.type_sig,
            this.links.update(
                port_id,
                new Set(),
                (s) => {return s.add(link_id)}));
    }
    
    removeLink(port_id, link_id) {
        if (this.links.has(port_id) && this.links.get(port_id).includes(link_id)) {
            var new_links = this.links.update(port_id, s => {s.delete(link_id)})
            return new NodeData(this.name, this.type_sig, new_links);
        } else {
            return this
        }
    }
    
    getLinks(port_id) {
        if (this.links.has(port_id)) {
            return this.links.get(port_id);
        } else {
            return new Set();
        }
    }
    
}