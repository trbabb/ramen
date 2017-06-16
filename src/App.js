import React, { Component }         from 'react'
import {NodeView}                   from './mNodeView'
import {deepUpdate, lazyDeepUpdate} from './update'
import update                       from 'immutability-helper'

import './App.css'


class App extends Component {
    
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
    
    onLinkCompleted = (p0, p1) => {
        // todo: we don't update the node state.
        // todo: add an addLink() action
        this.setState((prevState) => {
            var newLink = {
                src:  p0,
                sink: p1
            }
            var z = update(prevState, {links : {$push : [newLink]}});
            return z;
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
