import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
import * as mnode from './mNode.js'
import update from 'immutability-helper'


class App extends Component {
    
  onLinkCompleted = () => {
    console.log("LINK IS DONE.");
  }
    
  render() {
    
    var nodes = [
        {type_sig : {type_ids : ['f64','f64','f64','f64','f64'], n_sinks : 3}, 
         callName : "This is a function call",
         links    : {3 : [0]}},
        {type_sig : {type_ids : ['f64','f64','f64'],             n_sinks : 2}, 
         callName : "+",
         position : {x:250,y:250},
         links    : {0 : [0]}},
    ];
    var links = [
        {src : {node_id : 0, port_id : 3}, sink : {node_id : 1, port_id : 0}}
    ];
    
    return (
      <mnode.NodeView id="blurghfart" nodes={nodes} links={links} onLinkCompleted={this.onLinkCompleted}/>
    );
  }
}

export default App;
