export class GraphElement {
    
    constructor(type, id) {
        this.type = type
        this.id   = id
    }
    
    key() {
        // i hate javascript. this is the dumbest goddamn thing.
        return JSON.stringify(this)
    }
    
}