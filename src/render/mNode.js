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
    
    
    makePorts(doSinks) {
        var sig = this.props.def.type_sig;
        var z   = []
        
        // we HAVE to use function application here, because the body of a loop
        // does not create a closure. Thus the "i" inside of the ref callback
        // lambda would have a nonsense value.
        var that = this;
        (doSinks?sig.getSinkIDs():sig.getSourceIDs()).forEach(function(port_id) {
            var type_id = sig.type_by_port_id.get(port_id)
            var links   = that.props.node.links_by_id.get(port_id)
            var p = <Port
                key           = {port_id}
                port_id       = {port_id}
                node_id       = {that.props.node_id}
                def_id        = {that.props.node.def_id}
                type_id       = {type_id}
                connected     = {links !== undefined && links.size > 0}
                direction     = {doSinks ? [0,-1] : [0,1]}
                is_sink       = {doSinks}
                onPortClicked = {that.props.mutation_callbacks.onPortClicked}
                onPortMoved   = {that.props.mutation_callbacks.onPortMoved}
                onPortHovered   = {that.props.mutation_callbacks.onPortHovered} />
            z.push(p);
        });
        return z;
    }
    
    
   renderFunctionDefBody() {
        return (
            <div className="MNode Function">
                <div className="FnHeader Function">
                    <div className="CallName Function">{this.props.def.name}</div>
                    {this.makePorts(false)}
                    <PortConfig handlePortConfigClick={this.handlePortConfigClick}/>
                </div>
                <NodeView
                    ng={this.props.ng}
                    port_coords={this.props.port_coords}
                    mutation_callbacks={this.props.mutation_callbacks}/>
                <div className="PortGroup SinkPortGroup">
                    {this.makePorts(true)}
                    <PortConfig handlePortConfigClick={this.handlePortConfigClick}/>
                </div>
            </div>
        )
    }
    
    
    renderPlainBody() {
        return (
            <div className="MNode">
                <div className="PortGroup SinkPortGroup">
                    {this.makePorts(true)}
                    <PortConfig handlePortConfigClick={this.handlePortConfigClick}/>
                </div>
                <div className="CallName">
                    {this.props.def.name}
                </div>
                <div className="PortGroup SourcePortGroup">
                  <PortConfig handlePortConfigClick={this.handlePortConfigClick}/>
                    {this.makePorts(false)}
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