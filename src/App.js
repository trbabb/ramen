import React      from 'react'
import * as _     from 'lodash'
import {Map}      from 'immutable'

import {NodeView} from './mNodeView'
import {NodeData} from './NodeData'

import './App.css'


// todo: use asMutable to speed up some of the edits.


class App extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = this.getDefaultState();
    }
    
    
    getDefaultState() {
        return {
            nodes : new Map(),
            links : new Map(),
            child_nodes : new Set(),
            child_links : new Set(),
            max_node_id : 0,
            max_link_id : 0
        }
    }
    
    
    componentDidMount = () => {
        this.addNode("wat", {type_ids: ['f64','f64','f64','f64'], n_sinks: 3})
        this.addNode("+", {type_ids: ['i32','i32','i32'], n_sinks: 2})
        this.addNode("a function named \"💩\"", {type_ids: ['f64','f64','f64','f64'], n_sinks: 2})
        this.addLink({node_id : 0, port_id : 3}, {node_id : 1, port_id : 0})
    }
    
    
    addNode(name, type_sig, parent_id=null, id=null) {
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
                parent_node.addChildNode(id);
                s.nodes = s.nodes.set(parent_id, parent_node);
            }
            
            return s
        })
    }
    
    
    addLink(port_0, port_1) {
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
            var sink_node  = prevState.nodes.get(new_link.sink.node_id);
            var src_node   = prevState.nodes.get(new_link.src.node_id);
            // check for a link matching the one we're about to make.
            var cxn_exists = sink_node.getLinks(new_link.sink.port_id)
            cxn_exists = cxn_exists.find(x => {
                return _.isEqual(prevState.links.get(x), new_link);
            });
            
            if (cxn_exists !== undefined) {
                // link exists; don't make a redundancy.
                console.log("Rejected link; exists."); // xxx debug
                return false;
            } else {
                console.log("Accepted link."); // xxx debug
                var new_link_id = prevState.max_link_id;
                // 'mutate' the nodes
                src_node  =  src_node.addLink(new_link.src.port_id,  new_link_id);
                sink_node = sink_node.addLink(new_link.sink.port_id, new_link_id);
                
                // clobber the old node entries
                var s   = {nodes : prevState.nodes.set(new_link.src.node_id,  src_node)};
                s.nodes =                  s.nodes.set(new_link.sink.node_id, sink_node);
                
                // add the link
                s.links = prevState.links.set(new_link_id, new_link);
                
                // add the link to the parent
                var parent_id   = src_node.parent;
                var parent_node = null;
                
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
    
    
    removeLink(link_id) {
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
                s.child_links = prevState.child_links.delete(link_id);
            } else {
                var parent_node = prevState.nodes.get(parent_id);
                parent_node = parent_node.removeChildLink(link_id);
                s.nodes = s.nodes.set(parent_id, parent_node);
            }
            
            return s
        })
    }
    
    
    onLinkCompleted = (p0, p1) => {
        this.addLink(p0, p1);
    }
    
    
    onLinkDisconnected = (linkID) => {
        this.removeLink(linkID);
    }
    
    
    render() {
        return (
            <NodeView
                nodes={this.state.nodes}
                links={this.state.links}
                child_nodes={this.state.child_nodes}
                child_links={this.state.child_links}
                onLinkCompleted={this.onLinkCompleted}
                onLinkDisconnected={this.onLinkDisconnected}/>
        );
    }
    
}

export default App;
