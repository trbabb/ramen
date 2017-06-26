import React      from 'react';
import Draggable  from 'react-draggable';
import {Port}     from './mPort';
import {NodeView} from './mNodeView';


// MNode is the React element for a language node.


export class MNode extends React.PureComponent {
    
    
    constructor(props) {
        super(props);
        this.portElems = [];
        this.selfElem  = null;
        this.state     = {
            position : ("position" in props) ? (props.position) : {x:0, y:0}
        };
    }
    
    
    componentDidMount() {
        // set the initial port positions
        //this.updateAllPorts();
    }
    
    
    onDrag = (e, position) => {
        this.setState({position: position});
        //this.updateAllPorts();
    }
    
    // xxx delete me {
    
    updatePort(port_idx) {
        var xy  = this.portElems[port_idx].getConnectionPoint();
        var evt = {
            node_id : this.props.node_id,
            port_id : port_idx,
            is_sink : port_idx < this.props.type_sig.n_sinks,
            new_pos : xy
        };
        this.props.mutation_callbacks.onPortMoved(evt);
    }
    
    
    updateAllPorts = () => {
        if (this.props.mutation_callbacks.onPortMoved) {
            for (var i = 0; i < this.portElems.length; ++i) {
                this.updatePort(i);
            }
        }
    }
    
    // }
    
    
    makePorts(doSinks) {
        var sig   = this.props.type_sig;
        var start = doSinks ? 0 : sig.n_sinks;
        var end   = doSinks ? sig.n_sinks : sig.type_ids.length;
        var z = []
        
        // we HAVE to use function application here, because the body of a loop
        // does not create a closure. Thus the "i" inside of the ref callback
        // lambda would have a nonsense value.
        var that = this;
        sig.type_ids.slice(start, end).forEach(function(type_id, i) {
            var port_id = start + i;
            var p = <Port
                key           = {port_id}
                port_id       = {port_id}
                node_id       = {that.props.node_id}
                type_id       = {type_id}
                links         = {that.props.port_links.get(port_id)}
                direction     = {doSinks ? [0,-1] : [0,1]}
                is_sink       = {doSinks}
                onPortClicked = {that.props.mutation_callbacks.onPortClicked}
                onPortMoved   = {that.props.mutation_callbacks.onPortMoved}
                ref = {function(e) {
                    that.portElems[port_id] = e;
                }} />
            z.push(p);
        });
        return z;
    }
    
    
   renderFunctionDefBody() {
        return (
            <div className="MNode Function">
                <div className="FnHeader Function">
                    <div className="CallName Function">{this.props.name}</div>
                    {this.makePorts(false)}
                </div>
                <NodeView 
                    nodes={this.props.nodes}
                    links={this.props.links}
                    port_coords={this.props.port_coords}
                    child_nodes={this.props.child_nodes}
                    child_links={this.props.child_links}
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
                    {this.props.name}
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
                {this.props.child_nodes.size > 0 ? this.renderFunctionDefBody() : this.renderPlainBody()}
            </Draggable>
        );
    }
    
}