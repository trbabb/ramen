import {Map} from 'immutable'

class NodeGraph {
    
    constructor(links=null, nodes=null) {
        this.links = (links === null) ? new Map() : links
        this.nodes = (nodes === null) ? new Map() : nodes
    }
    
    
    addNode(name, type_sig) {
        return
    }
    
}