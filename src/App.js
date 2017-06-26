import React           from 'react'
import * as _          from 'lodash'
import {Map, Set}      from 'immutable'
import ReactDOM        from 'react-dom';

import {NodeView}      from './mNodeView'
import {NodeData}      from './NodeData'
import {Link}          from './mLink'
import {NewNodeDialog} from './mNewNodeDialog'

import './App.css'


// todo: use asMutable to speed up some of the edits.
// todo: make nodeviews resize themselves to contain their nodes.
// todo: both nodeviews and ports must not drag the parent node
// todo: function def ports and names should show up on the same line.
// todo: link does not follow beyond the edge of the nodeview and this is bad for interaction
// todo: nodes must accept initial position
// todo: attempting a connection from outer node to inner behaves weirdly
//       (that's because each nodeView has its own temporary link)
//       (maybe that should be owned by the App)
// todo: the above also makes it impossible to connect function args to function body.
//       we should in general allow nodes to connect across nesting levels.


// someday: draw the type at the free end of the temporary link.


class App extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = this.getDefaultState();
    }
    
    
    getDefaultState() {
        return {
            // node graph state:
            nodes        : new Map(),
            links        : new Map(),
            
            // immediate children:
            child_nodes  : new Set(),
            child_links  : new Set(),
            
            // for ID uniqification:
            max_node_id  : 0,
            max_link_id  : 0,
            
            // "partial link" logic:
            mouse_pos    : [0,0], // in local coords
            partial_link : null,  // anchor port
            
            port_coords  : new Map(), // in window coords
            
            showing_node_dialog : true
        }
    }
    
    
    componentDidMount = () => {
        this.addNode("wat", {type_ids: ['f64','f64','f64','f64'], n_sinks: 3})
        this.addNode("+", {type_ids: ['i32','i32','i32'], n_sinks: 2})
        this.addNode("a function named \"💩\"", {type_ids: ['f64','f64','f64','f64'], n_sinks: 2})
        this.addNode("function def",            {type_ids: ['s','s','s'],             n_sinks: 2})
        this.addNode("child node",              {type_ids: ['s','s'],                 n_sinks:1}, 3) // parent=3
        this.addNode("another kid",             {type_ids: ['s','s','s'],             n_sinks:1}, 3) // parent=3
        
        this.addLink({node_id : 0, port_id : 3}, {node_id : 1, port_id : 0})
    }
    
    /****** Mutation functions ******/
    
    
    addNode = (name, type_sig, parent_id=null, id=null) => {
        this.setState(prevState => {
            if (id === null) {
                id = prevState.max_node_id;
            }
            var s = {max_node_id : Math.max(prevState.max_node_id, id) + 1}
            s.nodes = prevState.nodes.set(id, new NodeData(name, type_sig, parent_id))
            
            if (parent_id === null) {
                s.child_nodes = prevState.child_nodes.add(id)
            } else {
                var parent_node = prevState.nodes.get(parent_id)
                parent_node = parent_node.addChildNode(id);
                s.nodes = s.nodes.set(parent_id, parent_node);
            }
            
            return s
        })
    }
    
    
    addLink = (port_0, port_1) => {
        this.setState((prevState) => {
            var p0_sink = prevState.nodes.get(port_0.node_id).isPortSink(port_0.port_id);
            var p1_sink = prevState.nodes.get(port_1.node_id).isPortSink(port_1.port_id);
            
            if (p0_sink === p1_sink) {
                // can't connect a src to a src or a sink to a sink.
                console.log("Rejected link; must connect source to sink.");
                return false;
            }
            
            // order the link source to sink.
            var new_link;
            if (p0_sink) {
                new_link = {
                    sink : port_0,
                    src  : port_1
                }
            } else {
                new_link = {
                    sink : port_1,
                    src  : port_0
                }
            }
            
            // get endpoint nodes
            var sink_id    = new_link.sink.node_id;
            var src_id     = new_link.src.node_id;
            var sink_node  = prevState.nodes.get(sink_id);
            var src_node   = prevState.nodes.get(src_id);
            // check for a link matching the one we're about to make.
            var cxn_exists = sink_node.getLinks(new_link.sink.port_id)
            cxn_exists = cxn_exists.find(x => {
                return _.isEqual(prevState.links.get(x), new_link);
            });
            
            var src_parent  = src_node.parent;
            var sink_parent = sink_node.parent;
            
            if (cxn_exists !== undefined) {
                // link exists; don't make a redundancy.
                console.log("Rejected link; exists."); // xxx debug
                return false;
            } if (sink_parent != src_parent && 
                  sink_parent != src_id &&
                  src_parent  != sink_id) {
                // xxx debug
                console.log("Rejected link; links must be to siblings or parent-to-child.")
            } else {
                console.log("Accepted link."); // xxx debug
                var new_link_id = prevState.max_link_id;
                // 'mutate' the nodes
                src_node  =  src_node.addLink(new_link.src.port_id,  new_link_id);
                sink_node = sink_node.addLink(new_link.sink.port_id, new_link_id);
                
                // clobber the old node entries
                var s   = {nodes : prevState.nodes.set(src_id,  src_node)};
                s.nodes =                  s.nodes.set(sink_id, sink_node);
                
                // add the link
                s.links = prevState.links.set(new_link_id, new_link);
                
                // add the link to the parent
                var parent_id = src_parent;
                if (sink_parent != src_parent && sink_parent == src_id) {
                    // in this case, the parent of the sink is the source.
                    // the link should belong to the source (outer) node,
                    // not the *parent* of the outer node.
                    parent_id = sink_parent;
                }
                if (parent_id === null) {
                    s.child_links = prevState.child_links.add(new_link_id);
                } else {
                    var parent_node = prevState.nodes.get(parent_id)
                    parent_node = parent_node.addChildLink(new_link_id)
                    s.nodes = s.nodes.set(parent_id, parent_node)
                }
                
                s.max_link_id = new_link_id + 1;
                
                return s;
            }
        });
    }
    
    
    removeLink = (link_id) => {
        this.setState((prevState) => {
            var link      = prevState.links.get(link_id);
            var src_node  = prevState.nodes.get(link.src.node_id);
            var sink_node = prevState.nodes.get(link.sink.node_id);
            src_node      =  src_node.removeLink(link.src.port_id,  link_id);
            sink_node     = sink_node.removeLink(link.sink.port_id, link_id);
            
            var s = {
                links : prevState.links.delete(link_id),
                nodes : prevState.nodes.set(link.src.node_id, src_node).set(link.sink.node_id, sink_node)
            }
            
            // remove link from its parent
            var parent_id = src_node.parent;
            if (parent_id === null) {
                s.child_links = prevState.child_links.remove(link_id);
            } else {
                var parent_node = prevState.nodes.get(parent_id);
                parent_node = parent_node.removeChildLink(link_id);
                s.nodes = s.nodes.set(parent_id, parent_node);
            }
            
            return s
        })
    }
    
    
    /****** Callback functions ******/
    
    
    onPortClicked = ({node_id, port_id, elem, mouse_evt}) => {
        // create or complete the "partial" link
        var p = {node_id : node_id, port_id : port_id}
        if (this.state.partial_link === null) {
            this.setState({partial_link : p})
        } else {
            // complete a partial link
            this.addLink(this.state.partial_link, p)
            this.setState({partial_link : null})
        }
    }
    
    
    onLinkDisconnected = (linkID) => {
        this.removeLink(linkID);
    }
    
    
    onPortMoved = ({node_id, port_id, is_sink, new_pos}) => {
        this.setState(prevState => {
            return {port_coords : prevState.port_coords.setIn([node_id, port_id], new_pos)}
        })
    }
    
    
    onMouseMove = (evt) => {
        var eDom = ReactDOM.findDOMNode(this.elem);
        var box  = eDom.getBoundingClientRect()
        // update the mouse position so that the partial link can follow it.
        this.setState({mouse_pos : [evt.clientX - box.left, evt.clientY - box.top]});
    }
    
    
    onClick = (evt) => {
        if (this.state.partial_link !== null) {
            // cancel the active link.
            this.setState({partial_link : null});
        }
    }
    
    
    onLinkEndpointClicked = ({mouseEvt, linkID, isSource}) => {
        var link = this.state.links.get(linkID)
        // we want the endpoint that *wasn't* grabbed
        var port = isSource ? link.sink : link.src
        
        console.assert(this.state.partial_link === null);
        
        // "pick up" the link
        this.removeLink(linkID);
        this.setState({partial_link : port});
    }
    
    
    /****** Rendering functions ******/
    
    
    renderPartialLink() {
        if (this.state.partial_link !== null) {
            var port  = this.state.partial_link
            var i     = [port.node_id, port.port_id]
            var cxnPt = this.state.port_coords.getIn(i)
            var myDom = ReactDOM.findDOMNode(this.elem) // XXX update this in compDid{Update,Mount}
            var myBox = myDom.getBoundingClientRect()
            var pt    = [cxnPt[0] - myBox.left, cxnPt[1] - myBox.top]
            return (<Link
                points={[this.state.mouse_pos, pt]}
                partial={true}/>);
        }
    }
    
    
    renderNewNodeDialog() {
        var availableNodes = [
            new NodeData("+", {type_ids : ['f64', 'f64', 'f64'], n_sinks: 2}),
            new NodeData("-", {type_ids : ['f64', 'f64', 'f64'], n_sinks: 2}),
            new NodeData("*", {type_ids : ['f64', 'f64', 'f64'], n_sinks: 2}),
            new NodeData("/", {type_ids : ['f64', 'f64', 'f64'], n_sinks: 2})
        ]
        
        return (
            <NewNodeDialog 
                className="NewNodeDialog"
                onNodeCreate={this.addNode}
                availableNodes={availableNodes}/>
        )
    }
    
    
    render() {
        var mutation_callbacks = {
            onLinkDisconnected    : this.onLinkDisconnected,
            onPortClicked         : this.onPortClicked,
            onPortMoved           : this.onPortMoved,
            onLinkEndpointClicked : this.onLinkEndpointClicked
        }
        return (
            <div
                onMouseMove={this.onMouseMove}
                onClick={this.onClick}
                ref={e => {this.elem = e}}>
                <NodeView
                    nodes={this.state.nodes}
                    links={this.state.links}
                    child_nodes={this.state.child_nodes}
                    child_links={this.state.child_links}
                    port_coords={this.state.port_coords}
                    mutation_callbacks={mutation_callbacks}/>
                {this.renderPartialLink()}
                {this.state.showing_node_dialog ? 
                    this.renderNewNodeDialog() :
                    []}
            </div>
        );
    }
    
}

export default App;
