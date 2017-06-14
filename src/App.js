import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import {TypeElem, TypeBar, MNode, Link, NodeView} from './mNode.js';




class App extends Component {
  render() {
    
    var nodes = [
        {type_sig : {type_ids : ['f64','f64','f64','f64','f64'], n_sinks : 3}, 
         callName : "This is a function call",
         links    : {3 : [0]}},
        {type_sig : {type_ids : ['f64','f64','f64'],             n_sinks : 2}, 
         callName : "+",
         links    : {0 : [0]}},
    ];
    var links = [
        {src : {node_id : 0, port_id : 3}, sink : {node_id : 1, port_id : 0}}
    ];
    
    return (
      <NodeView id="blurghfart" nodes={nodes} links={links}/>
    );
  }
}

export default App;
