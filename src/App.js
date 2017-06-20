import React                        from 'react'
import update                       from 'immutability-helper'
import * as _                       from 'lodash'
import {Map}                        from 'immutable'

import {NodeView}                   from './mNodeView'
import {deepUpdate, lazyDeepUpdate} from './update'
import {NodeData}                   from './NodeData'

import './App.css'


// thoughts:
// - It's terribly annoying that setState cannot edit an object.
//   1. This means we have to fuss with a very annoying duct tape system for copy-on-update,
//      with an inner language of "commands" for all the kinds of mutations that can be done to an object.
//   2. Any edit to a descendent of a large list (like a single node or a single link, in my case) is
//      going to involve copying that entire list. This transforms what should be an O(1) operation
//      into an O(n) operation. Remember SAT analogies? `this : me :: backwards-petting : a cat`.


class App extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = this.getDefaultState();
    }
    
    
    getDefaultState() {
        return {
            nodes : new Map(),
            links : new Map(),
            max_node_id : 0,
            max_link_id : 0
        };
    }
    
    
    componentDidMount = () => {
        this.addNode("wat", {type_ids: ['f64','f64','f64','f64'], n_sinks: 3})
        this.addNode("+", {type_ids: ['f64','f64','f64'], n_sinks: 2})
        this.addNode("a function named \"💩\"", {type_ids: ['f64','f64','f64','f64'], n_sinks: 2})
        this.addLink({node_id : 0, port_id : 3}, {node_id : 1, port_id : 0})
    }
    
    
    addNode(name, type_sig, id=null) {
        this.setState(prevState => {
            if (id === null) {
                id = prevState.max_node_id;
            }
            var s = {max_node_id : Math.max(prevState.max_node_id, id) + 1}
            s.nodes = prevState.nodes.set(id, new NodeData(name, type_sig))
            return s
        })
    }
    
    
    addLink(p0, p1) {
        this.setState((prevState) => {
            var p0_sink = prevState.nodes.get(p0.node_id).isPortSink(p0.port_id);
            var p1_sink = prevState.nodes.get(p1.node_id).isPortSink(p1.port_id);
            
            if (p0_sink === p1_sink) {
                // can't connect a src to a src or a sink to a sink.
                console.log("Rejected link; must connect source to sink.");
                return false;
            }
            
            // order the link source to sink.
            var new_link;
            if (p0_sink) {
                new_link = {
                    sink : p0,
                    src  : p1
                }
            } else {
                new_link = {
                    sink : p1,
                    src  : p0
                }
            }
            
            // get endpoint nodes
            var sink_node  = prevState.nodes.get(new_link.sink.node_id);
            var src_node   = prevState.nodes.get(new_link.src.node_id);
            // check for a link matching the one we're about to make.
            var cxn_exists = sink_node.getLinks(new_link.sink.port_id).find(x => {
                return _.isEqual(prevState.links.get(x), new_link);
            });
            
            if (cxn_exists !== undefined) {
                // link exists; don't make a redundancy.
                console.log("Rejected link; exists."); // xxx debug
                return false;
            } else {
                console.log("Accepted link."); // xxx debug
                var new_link_id = prevState.max_link_id;
                console.log("Creating link number ", new_link_id)
                // 'mutate' the nodes
                src_node        =  src_node.addLink(new_link.src.port_id,  new_link_id);
                sink_node       = sink_node.addLink(new_link.sink.port_id, new_link_id);
                // clobber the old node entries
                var s   = {nodes : prevState.nodes.set(new_link.src.node_id,  src_node)};
                s.nodes =                  s.nodes.set(new_link.sink.node_id, sink_node);
                // add the link
                s.links = prevState.links.set(new_link_id, new_link);
                s.max_link_id = new_link_id + 1;
                return s;
            }
        });
    }
    
    
    onLinkCompleted = (p0, p1) => {
        this.addLink(p0, p1);
    }
    
    
    onLinkDisconnected = (linkID) => {
        this.setState((prevState) => {
            return deepUpdate(prevState, ['links', linkID], undefined);
        });
    }
    
    
    render() {
        return (
            <NodeView 
                id="blurghfart" 
                nodes={this.state.nodes} 
                links={this.state.links} 
                onLinkCompleted={this.onLinkCompleted}/>
        );
    }
    
}

export default App;
