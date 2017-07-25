import React        from 'react';
import Draggable    from 'react-draggable';
import {Port}       from './mPort';
import {NodeView}   from './mNodeView';
import {PortConfig} from './mPortConfig';


// MNode is the React element for a language node.


export class MNode extends React.PureComponent {
    
    
    constructor(props) {
        super(props);
        var p = props.node.position
    }
    
    
    onDrag = (e, position) => {
        this.props.mutation_callbacks.onNodeMove(this.props.node_id, [position.x, position.y])
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
                key           = {port_id}
                port_id       = {port_id}
                node_id       = {node_id}
                type_id       = {type_id}
                connected     = {links !== undefined && links.size > 0}
                direction     = {doSinks ? [0,-1] : [0,1]}
                is_sink       = {doSinks}
                edit_target   = {editable ? edit_target : null}
                onPortClicked = {self.props.mutation_callbacks.onPortClicked}
                onPortMoved   = {self.props.mutation_callbacks.onPortMoved}
                onPortHovered = {self.props.mutation_callbacks.onPortHovered} />
            z.push(p);
        });
        return z;
    }
    
    
   renderFunctionDefBody() {
        if (!this.props.ng.nodes.has(this.props.node.entry_id) ||
            !this.props.ng.nodes.has(this.props.node.exit_id)) {
            return <div className = "MNode Function"></div>
        }
        var entry_node = this.props.ng.nodes.get(this.props.node.entry_id)
        var exit_node  = this.props.ng.nodes.get(this.props.node.exit_id)
        var entry_def  = this.props.ng.defs.get(entry_node.def_id)
        var exit_def   = this.props.ng.defs.get(exit_node.def_id)
        return (
            <div className="MNode Function">
                <div className="FnHeader Function">
                    <div className="CallName Function">{this.props.def.name}</div>
                    <div className="PortGroup SourcePortGroup BodyEntry">
                        {this.makePorts(this.props.node.entry_id, entry_node, entry_def.type_sig, false, true)}
                        <PortConfig 
                            is_sink={false}
                            def_id={this.props.node.def_id}
                            handlePortConfigClick={this.props.mutation_callbacks.onPortConfigClick}/>
                    </div>
                </div>
                <NodeView
                    ng={this.props.ng}
                    port_coords={this.props.port_coords}
                    mutation_callbacks={this.props.mutation_callbacks}/>
                <div className="PortGroup SinkPortGroup BodyExit">
                    <PortConfig 
                        is_sink={true}
                        def_id={this.props.node.def_id}
                        handlePortConfigClick={this.props.mutation_callbacks.onPortConfigClick}/>
                    {this.makePorts(this.props.node.exit_id, exit_node, exit_def.type_sig, true, true)}
                </div>
                <div className="PortGroup SinkPortGroup">
                    {this.makePorts(this.props.node_id, this.props.node, this.props.def.type_sig, false)}
                </div>
            </div>
        )
    }
    
    
    renderPlainBody() {
        return (
            <div className="MNode">
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
        var p = this.props.node.position
        return (
            <Draggable 
                    position={{x : p[0], y : p[1]}}
                    cancel=".NodeView"
                    onDrag={this.onDrag}>
                {this.props.def.hasBody() ? this.renderFunctionDefBody() : this.renderPlainBody()}
            </Draggable>
        );
    }
    
}