import React      from 'react'
import {Port}     from './mPort'
import {NodeView} from './mNodeView'
import {PortRack} from './mPortRack'


// todo: passing the type index around is stupid/heavy.
//       it should just be flat and live with the node sig,
//       which should also be flat and live with the node. 
//       see notes/types.txt in miso.


export class CallNodeBody extends React.PureComponent {
    
    constructor(props) {
        super(props)
    }
    
    render() {
        return (
            <div className="CallNode">
                {/* call inputs */}
                <PortRack 
                    node_id = {this.props.node_id}
                    def     = {this.props.def}
                    cbacks  = {this.props.cbacks}
                    is_sink = {true}
                    types   = {this.props.types}/>
                    
                {/* name  */}
                <div className="CallName">{this.props.def.name}</div>
                
                {/* call outputs */}
                <PortRack
                    node_id = {this.props.node_id}
                    def     = {this.props.def}
                    cbacks  = {this.props.cbacks}
                    is_sink = {false}
                    types   = {this.props.types}/>
            </div>
        )
    }
}


export class FunctionNodeBody extends React.PureComponent {
    
    constructor(props) {
        super(props)
    }
    
    render() {
        if (!this.props.node.entry_id || !this.props.node.exit_id) {
            return (<div></div>)
        }
        var entry = this.props.ng.nodes.get(this.props.node.entry_id)
        var exit  = this.props.ng.nodes.get(this.props.node.exit_id)
        return (
            <div className="FunctionNode">
                {/* function name */}
                <div className="CallName">{this.props.def.name}</div>
                {/* body entry */}
                <PortRack
                    node_id = {this.props.node.entry_id}
                    def     = {this.props.ng.defs.get(entry.def_id)}
                    is_sink = {false}
                    target  = {this.props.node.def_id}
                    cbacks  = {this.props.cbacks}/>
                
                {/* function body */}
                <NodeView
                    parent_id = {this.props.node_id}
                    ng        = {this.props.ng}
                    cbacks    = {this.props.cbacks}/>
                
                {/* body exit */}
                <PortRack
                    node_id = {this.props.node.exit_id}
                    def     = {this.props.ng.defs.get(exit.def_id)}
                    is_sink = {true}
                    target  = {this.props.node.def_id}
                    cbacks  = {this.props.cbacks}/>
                
                {/* definition output */}
                <PortRack
                    node_id = {this.props.node_id}
                    def     = {this.props.def}
                    is_sink = {false}
                    cbacks  = {this.props.cbacks}/>
            </div>
        )
    }
    
}


export class LiteralNodeBody extends React.PureComponent {
    
    constructor(props) {
        super(props)
    }
    
    render() {
        // not sure if "clear selection" is the right behavior, but 
        // we need /something/ for now so that backspace doesn't baleet everthang
        var sig      = this.props.def.type_sig
        var port_id  = sig.getSourceIDs().toSeq().first()
        var type_obj = sig.type_by_port_id.get(port_id)
        return (
            <div className="LiteralNode">
                <div className="Handle"> </div>
                <input 
                    className = "NodeInput"
                    name      = {this.props.node_id}
                    onFocus   = {e => {this.props.cbacks.clearSelection()}}/>
                <Port
                    port_id   = {port_id}
                    node_id   = {this.props.node_id}
                    is_sink   = {false}
                    type_id   = {type_obj.code}
                    direction = {[1,0]}
                    cbacks    = {this.props.cbacks}/>
            </div>
        )
    }
    
}