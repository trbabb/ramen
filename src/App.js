import React           from 'react'
import * as _          from 'lodash'
import {Map}           from 'immutable'
import ReactDOM        from 'react-dom';

import {NodeView}      from './mNodeView'
import {NodeData}      from './NodeData'
import {NodeGraph}     from './NodeGraph'
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


const availableNodes = [
        new NodeData("+", {type_ids : ['float', 'float', 'float'], n_sinks: 2}),
        new NodeData("-", {type_ids : ['float', 'float', 'float'], n_sinks: 2}),
        new NodeData("*", {type_ids : ['float', 'float', 'float'], n_sinks: 2}),
        new NodeData("/", {type_ids : ['float', 'float', 'float'], n_sinks: 2}),
        new NodeData("function", {type_ids : ['float', 'float', 'float'], n_sinks: 2}),
        new NodeData("helloWorld", {type_ids : ['float', 'float', 'float'], n_sinks: 2}),
        new NodeData("sendHello", {type_ids : ['float', 'float', 'float'], n_sinks: 2}),
        new NodeData("createWorld", {type_ids : ['float', 'float', 'float'], n_sinks: 2}),
        new NodeData("whatever", {type_ids : ['float', 'float', 'float'], n_sinks: 2})
    ]



class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = this.getDefaultState();
    }


    getDefaultState() {
        return {
            ng : new NodeGraph(),

            // "partial link" logic:
            mouse_pos    : [0,0], // in local coords
            partial_link : null,  // anchor port

            // in window coords
            port_coords  : new Map(),

            showing_node_dialog : false,

            port_hovered: {
              node_id: null,
              port_id: null
            }
        }
    }


    addNode(name, type_sig, parent_id=null) {
        this.setState(prevState => {
            return {ng:prevState.ng.addNode(name,type_sig,parent_id)}
        })
    }


    loadDefaultNodeGraph = () => {
        this.addNode("wat",                     {type_ids: ['float','float','float','float'], n_sinks: 3})
        this.addNode("+",                       {type_ids: ['int','int','int'], n_sinks: 2})
        this.addNode("a function named \"💩\"", {type_ids: ['float','float','float','float'], n_sinks: 2})
        this.addNode("function",                {type_ids: ['str','str','str'],               n_sinks: 2})
        this.addNode("child node",              {type_ids: ['str','str'],                     n_sinks:1}, 3) // parent=3
        this.addNode("another kid",             {type_ids: ['str','str','str'],               n_sinks:1}, 3) // parent=3

        this.addNode("DEMO", {type_ids: ['int','float','bool','type','str','list','proc','int'], n_sinks:7})

        //this.addLink({node_id : 0, port_id : 3}, {node_id : 1, port_id : 0})
    }


    componentDidMount = () => {
        this.loadDefaultNodeGraph()
        document.addEventListener('keydown', this.onHotKeyPressed);

    }


    updateMouse = (x, y) => {
        var eDom    = ReactDOM.findDOMNode(this.elem);
        var box     = eDom.getBoundingClientRect()
        var new_pos = [x - box.left, y - box.top]
        // update the mouse position so that the partial link can follow it.
        if (!_.isEqual(this.state.mouse_mos, new_pos)) {
            this.setState({mouse_pos : new_pos});
        }
    }


    /****** Callback functions ******/


    onPortClicked = ({node_id, port_id, elem, mouse_evt}) => {
        // create or complete the "partial" link
        var p = {node_id : node_id, port_id : port_id}
        if (this.state.partial_link === null) {
            this.setState({partial_link : p})
        } else {
            // complete a partial link
            this.setState(prevState => ({
                ng           : prevState.ng.addLink(this.state.partial_link, p),
                partial_link : null
            }))
        }
    }


    onHotKeyPressed = (evt) => {
        if (evt.key === " " && !this.state.showing_node_dialog) {
            this.setState({showing_node_dialog : true})
            evt.preventDefault()
        }
        if (evt.key === 'Delete' && this.state.port_hovered.port_id !== null) {
          const ph = this.state.port_hovered;
          this.setState(prevState => ({ ng: prevState.ng.removePort(ph.node_id, ph.port_id)}));
        }
    }


    onLinkDisconnected = (linkID) => {
        this.setState(prevState => ({
            ng : prevState.ng.removeLink(linkID)
        }))
    }


    onPortMoved = ({node_id, port_id, is_sink, new_pos}) => {
        this.setState(prevState => {
            return {port_coords : prevState.port_coords.setIn([node_id, port_id], new_pos)}
        })
    }

    onPortHovered = (node_id, port_id) => {
      this.setState({ port_hovered: {
        node_id,
        port_id
      }});
    }

    onMouseMove = (evt) => {
        if (this.state.partial_link !== null) {
            this.updateMouse(evt.clientX, evt.clientY)
        }
    }


    onClick = (evt) => {
        this.updateMouse(evt.clientX, evt.clientY)
        if (this.state.partial_link !== null) {
            // cancel the active link.
            this.setState({partial_link : null});
        }
    }


    onLinkEndpointClicked = ({mouseEvt, linkID, isSource}) => {
        var link = this.state.ng.links.get(linkID)
        // we want the endpoint that *wasn't* grabbed
        var port = isSource ? link.sink : link.src

        console.assert(this.state.partial_link === null);

        // "pick up" the link
        this.setState(prevState => ({
            ng           : prevState.ng.removeLink(linkID),
            partial_link : port
        }));
    }


    onNodeCreate = (node) => {
        this.setState(prevState => {
            var s = {showing_node_dialog : false}
            if (node !== null) {
               s.ng = prevState.ng.addNode(node.name, node.type_sig)
            }
            return s
        })
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
        return (
            <NewNodeDialog
                className="NewNodeDialog"
                onNodeCreate={this.onNodeCreate}
                availableNodes={availableNodes}/>
        )
    }


    render() {
        var mutation_callbacks = {
            onLinkDisconnected    : this.onLinkDisconnected,
            onPortClicked         : this.onPortClicked,
            onPortMoved           : this.onPortMoved,
            onPortHovered         : this.onPortHovered,
            onLinkEndpointClicked : this.onLinkEndpointClicked
        }
        return (
            <div
                onMouseMove={this.onMouseMove}
                onClick={this.onClick}
                ref={e => {this.elem = e}}>
                <NodeView
                    ng={this.state.ng}
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
