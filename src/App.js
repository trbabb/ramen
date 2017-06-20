import React                        from 'react'
import {NodeView}                   from './mNodeView'
import {deepUpdate, lazyDeepUpdate} from './update'
import update                       from 'immutability-helper'
import * as _                       from 'lodash'
import * as Immutable               from 'immutable'

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
        var nodes = [
            {type_sig : {type_ids : ['f64','f64','f64','f64','f64'], n_sinks : 3}, 
             callName : "This is a function call",
             links    : {3 : [0]}},
            {type_sig : {type_ids : ['f64','f64','f64'],             n_sinks : 2}, 
             callName : "+",
             position : {x:250, y:250},
             links    : {0 : [0]}},
        ];
        var links = [
            {src : {node_id : 0, port_id : 3}, sink : {node_id : 1, port_id : 0}}
        ];
        return {
            nodes : nodes,
            links : links
        };
    }
    
    
    _isPortSink(state, port) {
        var n = state.nodes[port.node_id];
        return port.port_id < n.type_sig.n_sinks
    }
    
    
    _connectionExists(state, link) {
        var sink_node  = state.nodes[link.sink.node_id];
        var sink_links = sink_node.links[link.sink.port_id];
        
        // no links on that port.
        if (sink_links === undefined) {
            return false;
        }
        
        // do any of the links on this port match the one we're adding?
        if (_.findIndex(sink_links, (x) => _.isEqual(state.links[x], link)) < 0) {
            // nope; not found
            return false;
        } else {
            return true;
        }
    }
    
    
    // stateless helper. return a copy-on-update'd version of `state` with 
    // the port/link connection made.
    _addLinkToPort(state, link_id, {node_id, port_id}) {
        return lazyDeepUpdate(
            state, 
            ['nodes', node_id, 'links', port_id],
            [link_id],
            [Object,  Array,   Array,   Array],
            '$push');
    }
    
    
    addLink(port_0, port_1) {
        this.setState((prevState) => {
            var p0_sink = this._isPortSink(prevState, port_0);
            var p1_sink = this._isPortSink(prevState, port_1);
            var new_link;
            
            if (p0_sink === p1_sink) {
                // can't connect a src to a src or a sink to a sink.
                console.log("Rejected link; must connect source to sink.");
                return false;
            }
            
            // order the link source to sink.
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
            
            if (this._connectionExists(prevState, new_link)) {
                // link exists; don't make a redundancy.
                console.log("Rejected link; exists."); // xxx debug
                return false;
            } else {
                console.log("Accepted link.");
                // add the new link to the list of links
                var new_link_id = prevState.links.length;
                //var s = prevState; // xxx debug
                var s = this._addLinkToPort(prevState, new_link_id, new_link.src);
                s     = this._addLinkToPort(s,         new_link_id, new_link.sink);
                // now add the link to the list of links.
                return update(s, {links  : {$push : [new_link]}});
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
