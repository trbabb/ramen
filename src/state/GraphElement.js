export class GraphElement {
    
    constructor(type, id) {
        this.type = type
        this.id   = id
    }
    
    key() {
        return Symbol.for(this)
    }
    
}