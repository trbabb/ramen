import React      from 'react'
import {Port}     from './mPort'
import {NodeView} from './mNodeView'
import {PortRack} from './mPortRack'


// todo: passing the type index around is stupid/heavy.
//       it should just be flat and live with the node sig,
//       which should also be flat and live with the node. 
//       see notes/types.txt in miso.


export class CallNodeBody extends React.PureComponent {
    
    render() {
        return (
            <div className="CallNode">
                {/* call inputs */}
                <PortRack 
                    node_id = {this.props.node_id}
                    ports   = {this.props.def.type_sig.sink_types}
                    cbacks  = {this.props.cbacks}
                    is_sink = {true}
                    types   = {this.props.types}/>
                    
                {/* name  */}
                <div className="CallName">{this.props.def.name}</div>
                
                {/* call outputs */}
                <PortRack
                    node_id = {this.props.node_id}
                    ports   = {this.props.def.type_sig.source_types}
                    cbacks  = {this.props.cbacks}
                    is_sink = {false}
                    types   = {this.props.types}/>
            </div>
        )
    }
}


export class FunctionNodeBody extends React.PureComponent {
    
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
                    ports   = {this.props.ng.defs.get(entry.def_id).type_sig.source_types}
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
                    ports   = {this.props.ng.defs.get(exit.def_id).type_sig.sink_types}
                    is_sink = {true}
                    target  = {this.props.node.def_id}
                    cbacks  = {this.props.cbacks}/>
                
                {/* definition output */}
                <PortRack
                    node_id = {this.props.node_id}
                    ports   = {this.props.def.type_sig.source_types}
                    is_sink = {false}
                    cbacks  = {this.props.cbacks}/>
            </div>
        )
    }
    
}


export class LoopNodeBody extends React.PureComponent {
    
    constructor(props) {
        super(props)
        this.exit_ports = null
    }
    
    
    render() {
        if (!this.props.node.entry_id || !this.props.node.exit_id) {
            return (<div></div>)
        }
        var entry = this.props.ng.nodes.get(this.props.node.entry_id)
        var exit  = this.props.ng.nodes.get(this.props.node.exit_id)
        return (
            <div className="LoopNode">
                {/* parent node entry */}
                <PortRack
                    node_id = {this.props.node_id}
                    ports   = {this.props.def.type_sig.sink_types}
                    is_sink = {true}
                    target  = {this.props.node.def_id}
                    cbacks  = {this.props.cbacks}/>
                {/* body entry */}
                <PortRack
                    node_id = {this.props.node.entry_id}
                    ports   = {this.props.ng.defs.get(entry.def_id).type_sig.source_types}
                    is_sink = {false}
                    cbacks  = {this.props.cbacks}/>
                {/* function body */}
                <NodeView
                    parent_id = {this.props.node_id}
                    ng        = {this.props.ng}
                    cbacks    = {this.props.cbacks}/>
                {/* body exit */}
                <PortRack
                    node_id = {this.props.node.exit_id}
                    ports   = {this.props.ng.defs.get(exit.def_id).type_sig.sink_types}
                    is_sink = {true}
                    cbacks  = {this.props.cbacks}/>
                {/* parent node exit */}
                <PortRack
                    node_id = {this.props.node_id}
                    ports   = {this.props.def.type_sig.source_types}
                    is_sink = {false}
                    target  = {this.props.node.def_id}
                    cbacks  = {this.props.cbacks}/>
            </div>
        )
    }
    
}


export class LiteralNodeBody extends React.PureComponent {
    
    constructor(props) {
        super(props)
        this.state = {
            value : this.props.node.value
        }
    }
    
    
    componentWillReceiveProps(nextProps) {
        this.setState({value : nextProps.node.value})
    }
    
    
    commitValue = (v) => {
        this.props.cbacks.dispatchCommand(
            "set", 
            "literal", 
            {
                value   : v,
                node_id : this.props.node_id,
            })
    }
    
    
    render() {
        
        const TYPE_COLORS = {
            'int32_t'   : '#ffb005',
            'int64_t'   : '#ffb005',
            'float32_t' : '#ff7a7a',
            'float64_t' : '#ff7a7a',
            'string_t'  : '#86d61d',
            'bool_t'    : 'black',
            'proc_t'    : '#00bff3',
            'array_t'   : '#a342f5',
            'type_t'    : '#ff00ff',
            'struct_t'  : '#3a43f9',
        };
                
        // not sure if "clear selection" is the right behavior, but 
        // we need /something/ for now so that backspace doesn't baleet everthang
        var sig      = this.props.def.type_sig
        var port_id  = sig.getSourceIDs().toSeq().first()
        var type_obj = sig.source_types.get(port_id)
        
        // xxx hack: does not override the right CSS element.
        //           the background of the node is the parent div,
        //           which we don't have control over. We should
        //           probably refactor this; maybe use class inheritance
        //           instead of composition.
        var s = {
            backgroundColor : TYPE_COLORS[type_obj.code], 
            borderRadius    : "4px", // <-- parallel to app.css. :(
        }
        
        return (
            <div className="LiteralNode" style={s}>
                <div className="Handle"> </div>
                <input 
                    className  = "NodeInput"
                    name       = {this.props.node_id}
                    value      = {this.state.value}
                    onChange   = {e => {this.setState({value : e.target.value})}}
                    onFocus    = {e => {this.props.cbacks.clearSelection()}}
                    onBlur     = {e => {this.commitValue(e.target.value)}}
                    onKeyPress = {e => {
                        if (e.key === "Enter" || e.key === "Return") {
                            this.commitValue(e.target.value)
                        }
                    }}/>
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