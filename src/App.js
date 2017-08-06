import React            from 'react'
import * as _           from 'lodash'
import {Map}            from 'immutable'
import ReactDOM         from 'react-dom'
import crypto           from 'crypto'

import {NodeGraph}      from './state/NodeGraph'
import {EditProxy}      from './state/EditProxy'
import {GraphElement}   from './state/GraphElement'
import {SelectionModel} from './state/SelectionModel'

import {NodeView}       from './render/mNodeView'
import {Link}           from './render/mLink'
import {NarrowingList}  from './render/mNarrowingList'

import './resource/App.css'


// todo: unify the two kinds of elements-- those used by the network and those used by the focus model.
//       it is dumb that we repeat ourselves in this way.
//       todo: it is also better to store the signature with every node. 
//             internal handling will be simpler because everything is right there.
//             it will also be easier to remove things from the selection when they are deleted,
//             and delete things that are selected by just directly passing the element to the EditProxy.
//       while refactoring this, it would be great if things were more directly translateable with the
//       backed AST/module elements. (if we do away with the def thing, that might help with this too).

// todo: use asMutable to speed up some of the edits.
// todo: make nodeviews resize themselves to contain their nodes.
// todo: both nodeviews and ports must not drag the parent node
// todo: function def ports and names should show up on the same line.
// todo: link does not follow beyond the edge of the nodeview and this is bad for interaction
// todo: nodes must accept initial position
// todo: the above also makes it impossible to connect function args to function body.
//       we should in general allow nodes to connect across nesting levels.
// todo: should we override and re-implement or take advantage of browser native focus traversal?
// todo: performance fix: only update port positions & node positions on drag stop.
//       find some other way (pass a callback, edit DOM directly?) to get the links to track.
// todo: xxx: links stopped updating after performance fix. GOD DAMMIT.


// someday: draw the type at the free end of the temporary link.


class App extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = this.getDefaultState();
        this.editProxy = new EditProxy(this)
        this.elements  = new Map()
        this.selection = new SelectionModel(this)
        
        // neccesary to store across frames, or else the entire app will
        // redraw on every frame D:
        this.mutation_callbacks = {
            onLinkDisconnected    : this.onLinkDisconnected,
            onPortClicked         : this.onPortClicked,
            onPortHovered         : this.onPortHovered,
            onLinkEndpointClicked : this.onLinkEndpointClicked,
            onNodeMove            : this.onNodeMove,
            onPortConfigClick     : this.onPortConfigClick,
            onElementMounted      : this.onElementMounted,
            onElementUnmounted    : this.onElementUnmounted,
            onElementFocused      : this.selection.onElementFocused,
            clearSelection        : this.selection.clear_selection,
            dispatchCommand       : this.dispatchCommand,
        }
    }
    
    
    /****** Setup / init ******/
    
    
    getDefaultState() {
        return {
            ng : new NodeGraph(),
            
            partial_link_anchor : null,
            partial_link_endpt  : [0,0],
            
            active_node_dialog : null,
            active_port_dialog : null,
            
            connected    : false,
            
            port_hovered : null,
        }
    }
    
    
    setPosition = (node_id, pos) => {
        this.setState(prevState => {
            return { ng : prevState.ng.setPosition(node_id, pos) }
        })
    }
    
    
    getElement = (elem) => {
        var elkey = elem.key()
        return this.elements.get(elkey)
    }
    
    
    componentDidMount() {
        if (this.elem !== null) {
            this.elem.focus()
        }
    }
    
    
    /****** Update functions ******/
    
    
    setConnected = (connected) => {
        this.setState({connected : connected})
    }
    
    
    setPartialLinkEndpoint = (xy) => {
        // move the endpoint of the partial link to the specified position,
        // specified in the coordinates of the top-level nodeview.
        if (!_.isEqual(this.state.partial_link_endpt)) {
            this.setState({partial_link_endpt : xy})
            if (this.state.partial_link_anchor) {
                var ge = new GraphElement("partial_link", this.state.partial_link_anchor)
                var link_el = this.getElement(ge)
                link_el.setEndpoint(xy, true)
            }
        }
    }
    
    
    updateMouse = (x, y) => {
        // the partial link tracks the mouse. update its position.
        var eDom    = ReactDOM.findDOMNode(this.elem);
        var box     = eDom.getBoundingClientRect()
        var new_pos = [x - box.left, y - box.top]
        this.setPartialLinkEndpoint(new_pos)
    }
    
    
    // parent_corner in local (top-level nodeview) coordinates
    updateConnectedPortLinks(node_id, port_id, is_sink, parent_corner=null) {
        // update the endpoint positions of all the links connected to the given port.
        var node = this.state.ng.nodes.get(node_id)
        
        if (!parent_corner) {
            var parent_view = this.getElement(new GraphElement("view", node.parent))
            parent_corner   = parent_view.getCorner()
        }
        
        var partial_link = this.state.partial_link_anchor
        var pe    = new GraphElement("port", {node_id, port_id, is_sink})
        var port  = this.getElement(pe)
        var links = node.getLinks(port_id, is_sink)
        var xy    = port.getConnectionPoint()
        var uv    = parent_corner
        
        for (let link_id of links) {
            let link_elem = this.getElement(new GraphElement("link", link_id))
            // set the endpoint in the coordinate space of the object it belongs to
            link_elem.setEndpoint([xy[0] - uv[0], xy[1] - uv[1]], is_sink)
        }
        
        // is the partial link connected to this port?
        if (partial_link && partial_link.node_id === node_id && partial_link.port_id === port_id) {
            let ge = new GraphElement("partial_link", this.state.partial_link_anchor)
            let partial_elem = this.getElement(ge)
            // coordinate space is OUR coordinate space.
            var master_view  = this.getElement(new GraphElement("view", null))
            var st           = master_view.getCorner()
            partial_elem.setEndpoint([xy[0] - st[0], xy[1] - st[1]], false)
        }
    }
    
    
    updateConnectedNodeLinks(node_id) {
        // update the endpoint positions of all the links connected to the given node. 
        var node         = this.state.ng.nodes.get(node_id)
        var sig          = this.state.ng.defs.get(node.def_id).type_sig
        var parent_view  = this.getElement(new GraphElement("view", node.parent))
        var c            = parent_view.getCorner()
        for (let {port_id, is_sink} of sig.getAllPorts()) {
            this.updateConnectedPortLinks(node_id, port_id, is_sink, c)
        }
    }
    
    
    /****** Callback functions ******/
    
    
    onElementMounted = (elem, component) => {
        // some child graph element has just created a DOM node for itself.
        // keep track of it (the element, not the DOM node) because
        // we frequently need to go find them to tell them to do stuff.
        var elkey = elem.key()
        this.elements = this.elements.set(elkey, component)
        
        // we do a lot of updating to ensure
        // the links stay connected to the ports :|
        if (elem.type === "link") {
            var link = this.state.ng.links.get(elem.id)
            this.updateConnectedPortLinks(link.src.node_id,  link.src.port_id,  false)
            this.updateConnectedPortLinks(link.sink.node_id, link.sink.port_id, true)
        } else if (elem.type === "port") {
            this.updateConnectedPortLinks(elem.id.node_id, elem.id.port_id, elem.id.is_sink)
        } else if (elem.type === "partial_link") {
            this.setPartialLinkEndpoint(this.state.partial_link_endpt)
            this.updateConnectedPortLinks(elem.id.node_id, elem.id.port_id, elem.id.is_sink)
        }
    }
    
    
    onElementUnmounted = (elem) => {
        var elkey = elem.key()
        this.selection.unselect(elem)
        this.elements = this.elements.remove(elkey)
    }
    
    
    onPortClicked = ({node_id, port_id, is_sink, mouse_evt}) => {
        // either create or complete the "partial" link
        var p = {node_id, port_id, is_sink}
        if (this.state.partial_link_anchor === null) {
            this.setState({partial_link_anchor : {node_id, port_id, is_sink}})
        } else {
            // complete a partial link
            var anchor_port = this.state.partial_link_anchor
            this.setState(prevState => ({
                partial_link_anchor : null
            }))
            var link = this.state.ng.constructLink(anchor_port, p)
            this.editProxy.action("add", "link", {link})
        }
    }
    
    
    dispatchCommand = (action, type, details) => {
        this.editProxy.action(action, type, details)
    }
    
    
    onKeyDown = (evt) => {
        // todo: make a user-configurable map of these
        if (evt.key === " " && this.state.active_node_dialog === null) {
            this.setState({active_node_dialog : {
                selected_elem : this.selection.edge
            }})
            evt.preventDefault()
        } else if ((evt.key === 'Delete' || evt.key === 'Backspace')) {
            // port deletion
            if (this.state.port_hovered !== null) {
                this.editProxy.action("remove", "port", this.state.port_hovered)
            } else if (this.selection.selected_elements.size > 0) {
                // todo: push these to a composite action
                // todo: make editProxy accept the element type
                var sel = this.selection.selected_elements.valueSeq()
                var link_elems = sel.filter(e => (e.type === "link"))
                var port_elems = sel.filter(e => (e.type === "port"))
                var node_elems = sel.filter(e => (e.type === "node"))
                
                // delete links
                for (let e of link_elems) {
                    this.editProxy.action("remove", "link", {link_id:e.id})
                }
                
                // TODO: handle ports after we do the def/signature refactoring.
                
                // delete nodes
                for (let e of node_elems) {
                    this.editProxy.action("remove", "node", {node_id:e.id})
                }
            }
        } else {
            this.selection.onKeyDown(evt)
        }
    }
    
    
    onKeyUp = (evt) => {
        this.selection.onKeyUp(evt)
    }
    
    
    onLinkDisconnected = (link_id) => {
        this.editProxy.action("remove", "link", {link_id})
    }
    
    
    onPortHovered = (target) => {
        this.setState({ port_hovered: target});
    }
    
    
    onNodeMove = (node_id, new_pos) => {
        // all the endpoints of the connected links need to be updated
        // to match the node's new position.
        this.updateConnectedNodeLinks(node_id)
    }
    
    
    onMouseMove = (evt) => {
        // currently used to make the "partial link" track the cursor.
        if (this.state.partial_link_anchor !== null) {
            this.updateMouse(evt.clientX, evt.clientY)
        }
    }
    
    
    onClick = (evt) => {
        // if the user clicks on the empty space outside of a node,
        // let go of the partial link.
        this.updateMouse(evt.clientX, evt.clientY)
        if (this.state.partial_link_anchor !== null) {
            this.setState({partial_link_anchor : null});
        }
    }
    
    
    onPortConfigClick = ({def_id, is_sink}) => {
        // bring up the type selection dialog for adding a port
        this.setState({active_port_dialog : {
            def_id : def_id, 
            is_arg : !is_sink}})
    }
    
    
    onLinkEndpointClicked = ({mouseEvt, link_id, isSource}) => {
        // if the user grabs the endpoint of a link, "pick it up" 
        // by disconnecting the grabbed link and creating a partial link.
        var link = this.state.ng.links.get(link_id)
        // we want to keep the endpoint that *wasn't* grabbed
        var port = isSource ? link.sink : link.src
        
        console.assert(this.state.partial_link_anchor === null);
        
        this.setState({
            partial_link_anchor : {
                node_id : port.node_id,
                port_id : port.port_id,
                is_sink : isSource,
            }
        })
        
        this.editProxy.action("remove", "link", {link_id})
    }
    
    
    onNodeCreate = (def_id) => {
        // drop a new node into the nodegraph with the prototype given by `def_id`.
        // where the node should be connected, and what its parent should be
        // both depend on what's selected. try to do a good job of being convenient.
        // called by the node placement dialog when it is closed.
        var elem = this.state.active_node_dialog.selected_elem
        this.setState(prevState => {
            return { active_node_dialog : null }
        })
        
        if (def_id !== null) {
            let parent_id    = null
            let connect_port = null
            
            // the selected elem at the time of placement determines any auto-parenting/auto-connect:
            if (elem !== null) {
                if (elem.type === "node") {
                    let node = this.state.ng.nodes.get(elem.id)
                    let def  = this.state.ng.defs.get(node.def_id)
                    if (def.hasBody()) {
                        // make new node a child of the selected node
                        parent_id = elem.id
                    } else {
                        // make the new node a sibling of the selected node
                        parent_id = node.parent
                        // connect the new node to the first output port of the selected node
                        let sig = def.type_sig
                        connect_port = {
                            node_id : elem.id,
                            port_id : sig.getSourceIDs().first(),
                            is_sink : false,
                        }
                    }
                } else if (elem.type === "port") {
                    let node = this.state.ng.nodes.get(elem.id.node_id)
                    parent_id   = node.parent
                    connect_port = elem.id
                } else if (elem.type === "link") {
                    // xxx todo: insert the node along the selected link.
                    //     implement composite actions; do [rm link, add node, add link, add link].
                }
            }
            
            // will be unique with astronomical probability:
            let node_id = crypto.randomBytes(8).toString('hex')
            
            // add the node
            this.editProxy.action("add", "node", {
                node_id   : node_id,
                def_id    : def_id,
                parent_id : parent_id,
            })
            
            // complete the auto-connect, if necessary:
            if (connect_port !== null) {
                let new_sig  = this.state.ng.defs.get(def_id).type_sig
                let new_port = {
                    node_id : node_id,
                    port_id : (connect_port.is_sink ? new_sig.getSourceIDs() : new_sig.getSinkIDs()).first(),
                    is_sink : !connect_port.is_sink
                }
                let link = {
                    src  : connect_port.is_sink ? new_port : connect_port,
                    sink : connect_port.is_sink ? connect_port : new_port,
                }
                this.editProxy.action("add", "link", {link})
            }
        }
    }
    
    
    onPortCreated = (def_id, type_id, is_sink) => {
        this.editProxy.action("add", "port", {
            def_id, 
            type_id,
            is_sink
        })
    }
    
    
    /****** Rendering functions ******/
    
    
    renderPartialLink() {
        if (this.state.partial_link_anchor !== null) {
            return (<Link
                partial={true}
                anchor={this.state.partial_link_anchor}
                onElementMounted={this.mutation_callbacks.onElementMounted}
                onElementUnmounted={this.mutation_callbacks.onElementUnmounted}/>);
        }
    }
    
    
    render() {
        var new_node_dlg = this.state.active_node_dialog !== null ? 
                (<NarrowingList
                    className="OverlayDialog"
                    items={this.state.ng.defs.filter((def, def_id) => this.state.ng.placeable_defs.has(def_id))}
                    onAccept={this.onNodeCreate}
                    stringifier={def => def.name}/>)
                : [];
        
        var new_port_dlg = this.state.active_port_dialog != null ?
                (<NarrowingList
                    className="OverlayDialog"
                    items={this.state.ng.types}
                    stringifier={(type_info) => type_info.code}
                    onAccept={(key) => {
                        if (key !== null) {
                            this.editProxy.action("add", "port", {
                                def_id  : this.state.active_port_dialog.def_id,
                                type_id : key,
                                is_arg  : this.state.active_port_dialog.is_arg
                            })
                        }
                        this.setState(prevState => {
                            return {active_port_dialog : null}
                        })
                    }}/>)
                : [];
        
        return (
            <div
                onMouseMove = {this.onMouseMove}
                onClick     = {this.onClick}>
                    <div
                        onKeyDown   = {this.onKeyDown}
                        onKeyUp     = {this.onKeyUp}
                        tabIndex    = {1}
                        ref         = {e => {this.elem = e}}>
                            <NodeView
                                parent_id = {null}
                                ng        = {this.state.ng}
                                cbacks    = {this.mutation_callbacks}/>
                            {this.renderPartialLink()}
                    </div>
                    {new_node_dlg}
                    {new_port_dlg}
                    {this.state.connected ? null : <p>NOT CONNECTED</p>}
            </div>
        );
    }
    
}

export default App;
