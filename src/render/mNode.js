import React          from 'react'
import Draggable      from 'react-draggable'
import ReactDOM       from 'react-dom'
import {Port}         from './mPort'
import {NodeView}     from './mNodeView'
import {PortConfig}   from './mPortConfig'
import {GraphElement} from '../state/GraphElement'
import {NODE_TYPE}    from '../state/Def'
import {CallNodeBody, 
        FunctionNodeBody, 
        LiteralNodeBody} from './NodeBody.js'

// MNode is the React element for a language node.


export class MNode extends React.PureComponent {
    
    
    constructor(props) {
        super(props);
        this.state = {
            selected : false,
            xy       : [0,0]
        }
        var p = props.node.position
        this.elem = null
    }
    
    
    getGraphElement() {
        return new GraphElement("node", this.props.node_id)
    }
    
    
    onRef = (e) => {
        this.elem = e
        if (e) {
            this.props.cbacks.onElementMounted(this.getGraphElement(), this)
        } else {
            this.props.cbacks.onElementUnmounted(this.getGraphElement())
        }
    }
    
    
    setSelected(selected) {
        this.setState({selected : selected})
    }
    
    
    grabFocus() {
        if (this.elem) {
            var dom_e = ReactDOM.findDOMNode(this.elem)
            if (dom_e) dom_e.focus()
        }
    }
    
    
    onDrag = (e, position) => {
        this.setState({xy: [position.x, position.y]})
        this.props.cbacks.onNodeMove(this.props.node_id, [position.x, position.y])
    }
    
    
    onFocus = (e) => {
        // we have to check if the focus event is actually targeting us and not one of our children.
        // if the latter, we don't want to steal focus/selection from them.
        var self_dom = ReactDOM.findDOMNode(this.elem)
        if (e.target === self_dom) {
            this.props.cbacks.onElementFocused(this.getGraphElement())
        }
    }
    
    
    makePorts(node_id, node, sig, doSinks, editable=false) {
        var z = []
        
        // we HAVE to use function application here, because the body of a loop
        // does not create a closure. Thus the "i" inside of the ref callback
        // lambda would have a nonsense value.
        var self = this;
        (doSinks?sig.getSinkIDs():sig.getSourceIDs()).forEach(function(port_id) {
            var type_id = sig.type_by_port_id.get(port_id)
            var links   = node.links_by_id.get(port_id)
            var edit_target = {
                def_id  : self.props.node.def_id,
                port_id : port_id,
                is_arg  : !doSinks,
            }
            
            var p = <Port
                key                = {port_id}
                port_id            = {port_id}
                node_id            = {node_id}
                type_id            = {self.props.types.get(type_id).code}
                connected          = {links !== undefined && links.size > 0}
                direction          = {doSinks ? [0,-1] : [0,1]}
                is_sink            = {doSinks}
                edit_target        = {editable ? edit_target : null}
                cbacks = {self.props.cbacks} />
            z.push(p);
        });
        return z;
    }
    
    
    renderFunctionDefBody() {
        if (!this.props.ng.nodes.has(this.props.node.entry_id) ||
            !this.props.ng.nodes.has(this.props.node.exit_id)) {
            return <div className = "MNode Function"></div>
        }
        var className  = "MNode" + (this.state.selected ? " SelectedGraphElement" : "")
        var entry_node = this.props.ng.nodes.get(this.props.node.entry_id)
        var exit_node  = this.props.ng.nodes.get(this.props.node.exit_id)
        var entry_def  = this.props.ng.defs.get(entry_node.def_id)
        var exit_def   = this.props.ng.defs.get(exit_node.def_id)
        return (
            <div className={className} tabIndex="1" 
                    onFocus={this.onFocus} 
                    ref={this.onRef}>
                <div className="FnHeader Function">
                    <div className="CallName Function">{this.props.def.name}</div>
                    <div className="PortGroup SourcePortGroup BodyEntry">
                        {this.makePorts(this.props.node.entry_id, entry_node, entry_def.type_sig, false, true)}
                        <PortConfig 
                            is_sink={false}
                            def_id={this.props.node.def_id}
                            handlePortConfigClick={this.props.cbacks.onPortConfigClick}/>
                    </div>
                </div>
                <NodeView
                    parent_id={this.props.node_id}
                    ng={this.props.ng}
                    cbacks={this.props.cbacks}/>
                <div className="PortGroup SinkPortGroup BodyExit">
                    <PortConfig 
                        is_sink={true}
                        def_id={this.props.node.def_id}
                        handlePortConfigClick={this.props.cbacks.onPortConfigClick}/>
                    {this.makePorts(this.props.node.exit_id, exit_node, exit_def.type_sig, true, true)}
                </div>
                <div className="PortGroup SinkPortGroup">
                    {this.makePorts(this.props.node_id, this.props.node, this.props.def.type_sig, false)}
                </div>
            </div>
        )
    }
    
    
    renderPlainBody() {
        var className = "MNode"
        if (this.state.selected) {
            className += " SelectedGraphElement"
        }
        return (
            <div className={className} tabIndex="1" 
                    onFocus={this.onFocus} 
                    ref={this.onRef}>
                <div className="PortGroup SinkPortGroup">
                    {this.makePorts(this.props.node_id, this.props.node, this.props.def.type_sig, true)}
                </div>
                <div className="CallName">
                    {this.props.def.name}
                </div>
                <div className="PortGroup SourcePortGroup">
                    {this.makePorts(this.props.node_id, this.props.node, this.props.def.type_sig, false)}
                </div>
            </div>
        );
    }
    
    
    render() {
        var p    = this.props.node.position
        var body = null
        var t    = this.props.def.node_type
        var subprops = {
            node    : this.props.node,
            node_id : this.props.node_id,
            def     : this.props.def,
            types   : this.props.types,
            cbacks  : this.props.cbacks,
        }
        if (t === NODE_TYPE.NODE_CALL ||
            t === NODE_TYPE.NODE_BUILTIN) {
            body = <CallNodeBody     {...subprops}/>
        } else if (t === NODE_TYPE.NODE_FUNCTION) {
            body = <FunctionNodeBody {...subprops} ng={this.props.ng}/>
        } else if (t === NODE_TYPE.NODE_LITERAL) {
            body = <LiteralNodeBody  {...subprops}/>
        } else {
            console.log("beh")
        }
        return (
            <Draggable
                    position={{x : this.state.xy[0], y : this.state.xy[1]}}
                    onDrag={this.onDrag}
                    cancel=".NodeView">
                <div className={"MNode" + (this.state.selected ? " SelectedGraphElement" : "")}
                        onFocus={this.onFocus}
                        ref={this.onRef}
                        tabIndex={1}>
                    {body}
                </div>
            </Draggable>
        );
    }
    
}