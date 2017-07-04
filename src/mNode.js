import React      from 'react';
import Draggable  from 'react-draggable';
import {Port}     from './mPort';
import {NodeView} from './mNodeView';


// MNode is the React element for a language node.


export class MNode extends React.PureComponent {
    
    
    constructor(props) {
        super(props);
        this.state = {
            position : ("position" in props) ? (props.position) : {x:0, y:0}
        };
    }
    
    
    onDrag = (e, position) => {
        this.setState({position: position});
    }
    
    
    makePorts(doSinks) {
        var sig = this.props.node.type_sig;
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
                type_id       = {type_id}
                connected     = {links !== undefined && links.size > 0}
                direction     = {doSinks ? [0,-1] : [0,1]}
                is_sink       = {doSinks}
                onPortClicked = {that.props.mutation_callbacks.onPortClicked}
                onPortMoved   = {that.props.mutation_callbacks.onPortMoved} />
            z.push(p);
        });
        return z;
    }
    
    
   renderFunctionDefBody() {
        return (
            <div className="MNode Function">
                <div className="FnHeader Function">
                    <div className="CallName Function">{this.props.node.name}</div>
                    {this.makePorts(false)}
                </div>
                <NodeView
                    ng={this.props.ng}
                    port_coords={this.props.port_coords}
                    mutation_callbacks={this.props.mutation_callbacks}/>
                <div className="PortGroup SinkPortGroup">
                    {this.makePorts(true)}
                </div>
            </div>
        )
    }
    
    
    renderPlainBody() {
        return (
            <div className="MNode">
                <div className="PortGroup SinkPortGroup">
                    {this.makePorts(true)}
                </div>
                <div className="CallName">
                    {this.props.node.name}
                </div>
                <div className="PortGroup SourcePortGroup">
                    {this.makePorts(false)}
                </div>
            </div>
        );
    }
    
    
    render() {
        return (
            <Draggable 
                    position={this.state.position}
                    cancel=".NodeView"
                    onDrag={this.onDrag}>
                {this.props.node.hasBody() ? this.renderFunctionDefBody() : this.renderPlainBody()}
            </Draggable>
        );
    }
    
}